#!/usr/bin/env tsx
/**
 * Route Annotation Validator
 *
 * Validates that all Next.js routes and pages have proper JSDoc annotations
 * for the deep linking and API registration system.
 *
 * Usage:
 *   npm run validate:routes
 *   npm run validate:routes -- --strict  # Fail on missing annotations
 */

import { Project, SyntaxKind, JSDoc, FunctionDeclaration, VariableDeclaration } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// Entity types that must be registered
const VALID_ENTITIES = ['BAR', 'QUEST', 'CAMPAIGN', 'SEED', 'WIKI', 'EVENT', 'NPC', 'DAEMON', 'PLAYER', 'SYSTEM'];

// Required annotation fields
const REQUIRED_FIELDS = ['@route', '@page', '@entity', '@description', '@permissions'];

interface RouteAnnotation {
  file: string;
  lineNumber: number;
  route?: string;
  method?: string;
  entity?: string;
  description?: string;
  permissions?: string[];
  params?: string[];
  query?: string[];
  relationships?: string[];
  energyCost?: number;
  dimensions?: Record<string, string>;
  example?: string;
  agentDiscoverable?: boolean;
  experimental?: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationResult {
  totalFiles: number;
  annotatedRoutes: RouteAnnotation[];
  unannotatedRoutes: string[];
  errors: string[];
  warnings: string[];
}

function parseJSDoc(jsDoc: JSDoc, filePath: string, lineNumber: number): RouteAnnotation {
  const annotation: RouteAnnotation = {
    file: filePath,
    lineNumber,
    errors: [],
    warnings: [],
  };

  const tags = jsDoc.getTags();

  for (const tag of tags) {
    const tagName = tag.getTagName();
    const text = tag.getCommentText()?.toString() || '';

    switch (tagName) {
      case 'route':
        const routeParts = text.split(' ');
        annotation.method = routeParts[0];
        annotation.route = routeParts.slice(1).join(' ');
        break;
      case 'page':
        annotation.route = text;
        annotation.method = 'PAGE';
        break;
      case 'entity':
        annotation.entity = text.trim().toUpperCase();
        if (!VALID_ENTITIES.includes(annotation.entity)) {
          annotation.errors.push(`Unknown entity type: ${annotation.entity}`);
        }
        break;
      case 'description':
        annotation.description = text;
        break;
      case 'permissions':
        annotation.permissions = text.split(',').map(p => p.trim());
        break;
      case 'params':
        annotation.params = annotation.params || [];
        annotation.params.push(text);
        break;
      case 'query':
      case 'searchParams':
        annotation.query = annotation.query || [];
        annotation.query.push(text);
        break;
      case 'relationships':
        annotation.relationships = annotation.relationships || [];
        annotation.relationships.push(text);
        break;
      case 'energyCost':
        annotation.energyCost = parseFloat(text) || 0;
        break;
      case 'dimensions':
        annotation.dimensions = annotation.dimensions || {};
        const dimParts = text.split(',').map(p => p.trim());
        for (const dim of dimParts) {
          const [key, value] = dim.split(':').map(s => s.trim());
          if (key && value) {
            annotation.dimensions[key] = value;
          }
        }
        break;
      case 'example':
        annotation.example = text;
        break;
      case 'agentDiscoverable':
        annotation.agentDiscoverable = text.toLowerCase() === 'true';
        break;
      case 'experimental':
        annotation.experimental = text.toLowerCase() === 'true';
        break;
    }
  }

  // Validate required fields
  if (!annotation.route) {
    annotation.errors.push('Missing @route or @page annotation');
  }
  if (!annotation.entity) {
    annotation.errors.push('Missing @entity annotation');
  }
  if (!annotation.description) {
    annotation.errors.push('Missing @description annotation');
  }
  if (!annotation.permissions || annotation.permissions.length === 0) {
    annotation.errors.push('Missing @permissions annotation');
  }

  // Check for warnings
  if (!annotation.example) {
    annotation.warnings.push('Missing @example (recommended for documentation)');
  }
  if (!annotation.dimensions) {
    annotation.warnings.push('Missing @dimensions (5D ontology incomplete)');
  }
  if (!annotation.relationships) {
    annotation.warnings.push('Missing @relationships (provenance not declared)');
  }

  return annotation;
}

function validateFile(filePath: string, project: Project): RouteAnnotation[] {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const annotations: RouteAnnotation[] = [];

  // Find exported functions (API route handlers)
  const exportedFunctions = sourceFile.getFunctions().filter(f => f.isExported());
  const exportedArrowFunctions = sourceFile.getVariableDeclarations().filter(v => {
    return v.isExported() && v.getInitializer()?.getKind() === SyntaxKind.ArrowFunction;
  });

  // Find default export (page components)
  const defaultExport = sourceFile.getDefaultExportSymbol();

  const functionsToCheck = [
    ...exportedFunctions,
    ...exportedArrowFunctions.map(v => v.getInitializer()),
  ];

  if (defaultExport) {
    const declarations = defaultExport.getDeclarations();
    for (const decl of declarations) {
      if (decl.getKind() === SyntaxKind.FunctionDeclaration) {
        functionsToCheck.push(decl as FunctionDeclaration);
      }
    }
  }

  for (const func of functionsToCheck) {
    if (!func) continue;

    const jsDocs = func.getJsDocs();
    if (jsDocs.length === 0) {
      continue; // Skip functions without JSDoc
    }

    for (const jsDoc of jsDocs) {
      const annotation = parseJSDoc(jsDoc, filePath, func.getStartLineNumber());
      if (annotation.route) {
        annotations.push(annotation);
      }
    }
  }

  return annotations;
}

async function validateRoutes(strict: boolean = false): Promise<ValidationResult> {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  });

  const result: ValidationResult = {
    totalFiles: 0,
    annotatedRoutes: [],
    unannotatedRoutes: [],
    errors: [],
    warnings: [],
  };

  // Find all API route files
  const apiRoutes = project.addSourceFilesAtPaths('src/app/api/**/route.ts');

  // Find all page files
  const pages = project.addSourceFilesAtPaths('src/app/**/page.tsx');

  const allFiles = [...apiRoutes, ...pages];
  result.totalFiles = allFiles.length;

  for (const file of allFiles) {
    const filePath = file.getFilePath();
    const annotations = validateFile(filePath, project);

    if (annotations.length === 0) {
      result.unannotatedRoutes.push(filePath);
      if (strict) {
        result.errors.push(`${filePath}: No route annotations found`);
      }
    } else {
      result.annotatedRoutes.push(...annotations);

      // Collect errors and warnings
      for (const annotation of annotations) {
        for (const error of annotation.errors) {
          result.errors.push(`${filePath}:${annotation.lineNumber} - ${error}`);
        }
        for (const warning of annotation.warnings) {
          result.warnings.push(`${filePath}:${annotation.lineNumber} - ${warning}`);
        }
      }
    }
  }

  return result;
}

function printReport(result: ValidationResult, strict: boolean) {
  console.log('\n🔍 Route Annotation Validation Report\n');
  console.log(`Total files scanned: ${result.totalFiles}`);
  console.log(`Annotated routes: ${result.annotatedRoutes.length}`);
  console.log(`Unannotated routes: ${result.unannotatedRoutes.length}`);
  console.log(`Coverage: ${Math.round((result.annotatedRoutes.length / result.totalFiles) * 100)}%\n`);

  if (result.errors.length > 0) {
    console.log(`❌ Errors (${result.errors.length}):`);
    for (const error of result.errors.slice(0, 10)) {
      console.log(`  - ${error}`);
    }
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more errors`);
    }
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log(`⚠️  Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings.slice(0, 10)) {
      console.log(`  - ${warning}`);
    }
    if (result.warnings.length > 10) {
      console.log(`  ... and ${result.warnings.length - 10} more warnings`);
    }
    console.log('');
  }

  if (result.unannotatedRoutes.length > 0 && result.unannotatedRoutes.length <= 20) {
    console.log('📋 Unannotated routes:');
    for (const route of result.unannotatedRoutes) {
      console.log(`  - ${route}`);
    }
    console.log('');
  }

  if (result.errors.length === 0) {
    console.log('✅ Validation passed!');
  } else if (strict) {
    console.log('❌ Validation failed (strict mode)');
    process.exit(1);
  } else {
    console.log('⚠️  Validation completed with errors (permissive mode)');
  }
}

// Main execution
const strict = process.argv.includes('--strict');

validateRoutes(strict)
  .then(result => {
    printReport(result, strict);
  })
  .catch(error => {
    console.error('❌ Validation error:', error);
    process.exit(1);
  });
