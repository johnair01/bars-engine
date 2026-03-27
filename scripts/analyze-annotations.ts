#!/usr/bin/env tsx
/**
 * Annotation Quality Analyzer
 *
 * Analyzes route annotations for completeness and quality beyond basic validation.
 * Generates reports on:
 * - Entity distribution
 * - Missing optional fields
 * - Completeness scores
 * - Agent discoverability stats
 * - Prioritized improvement recommendations
 *
 * Usage:
 *   npm run analyze:routes
 *   npm run analyze:routes -- --json  # JSON output
 */

import { Project, SyntaxKind, JSDoc } from 'ts-morph';
import * as path from 'path';

interface FieldPresence {
  route: boolean;
  entity: boolean;
  description: boolean;
  permissions: boolean;
  params: boolean;
  query: boolean;
  relationships: boolean;
  energyCost: boolean;
  dimensions: boolean;
  example: boolean;
  agentDiscoverable: boolean;
}

interface RouteQuality {
  file: string;
  route: string;
  entity: string;
  lineNumber: number;
  fields: FieldPresence;
  completeness: number; // 0-100
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

interface QualityReport {
  totalRoutes: number;
  averageCompleteness: number;
  entityDistribution: Record<string, number>;
  agentDiscoverableCount: number;
  fieldCoverage: Record<keyof FieldPresence, number>;
  highPriorityImprovements: RouteQuality[];
  mediumPriorityImprovements: RouteQuality[];
  topQualityRoutes: RouteQuality[];
}

function analyzeAnnotation(jsDoc: JSDoc, filePath: string, lineNumber: number): RouteQuality | null {
  const tags = jsDoc.getTags();
  const fields: FieldPresence = {
    route: false,
    entity: false,
    description: false,
    permissions: false,
    params: false,
    query: false,
    relationships: false,
    energyCost: false,
    dimensions: false,
    example: false,
    agentDiscoverable: false,
  };

  let route = '';
  let entity = '';
  const recommendations: string[] = [];

  for (const tag of tags) {
    const tagName = tag.getTagName();
    const text = tag.getCommentText()?.toString() || '';

    switch (tagName) {
      case 'route':
        fields.route = true;
        route = text;
        break;
      case 'page':
        fields.route = true;
        route = text;
        break;
      case 'entity':
        fields.entity = true;
        entity = text.trim().toUpperCase();
        break;
      case 'description':
        fields.description = true;
        break;
      case 'permissions':
        fields.permissions = true;
        break;
      case 'params':
        fields.params = true;
        break;
      case 'query':
      case 'searchParams':
        fields.query = true;
        break;
      case 'relationships':
        fields.relationships = true;
        break;
      case 'energyCost':
        fields.energyCost = true;
        break;
      case 'dimensions':
        fields.dimensions = true;
        break;
      case 'example':
        fields.example = true;
        break;
      case 'agentDiscoverable':
        fields.agentDiscoverable = true;
        break;
    }
  }

  if (!fields.route || !fields.entity) {
    return null; // Not a valid route annotation
  }

  // Generate recommendations
  if (!fields.relationships) {
    recommendations.push('Add @relationships to document provenance connections');
  }
  if (!fields.dimensions) {
    recommendations.push('Add @dimensions for 5D ontology mapping');
  }
  if (!fields.example) {
    recommendations.push('Add @example to show sample usage');
  }
  if (!fields.agentDiscoverable) {
    recommendations.push('Add @agentDiscoverable to declare agent visibility');
  }

  // Calculate completeness score
  const fieldCount = Object.values(fields).filter(Boolean).length;
  const totalFields = Object.keys(fields).length;
  const completeness = Math.round((fieldCount / totalFields) * 100);

  // Determine priority based on completeness and entity type
  let priority: 'high' | 'medium' | 'low' = 'low';
  if (completeness < 60) {
    priority = 'high';
  } else if (completeness < 80) {
    priority = 'medium';
  }

  // High priority for API routes with low completeness
  if (filePath.includes('/api/') && completeness < 70) {
    priority = 'high';
  }

  return {
    file: filePath.replace(process.cwd() + '/', ''),
    route,
    entity,
    lineNumber,
    fields,
    completeness,
    priority,
    recommendations,
  };
}

function analyzeFile(filePath: string, project: Project): RouteQuality[] {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const qualities: RouteQuality[] = [];

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
        functionsToCheck.push(decl as any);
      }
    }
  }

  for (const func of functionsToCheck) {
    if (!func) continue;

    const jsDocs = func.getJsDocs();
    for (const jsDoc of jsDocs) {
      const quality = analyzeAnnotation(jsDoc, filePath, func.getStartLineNumber());
      if (quality) {
        qualities.push(quality);
      }
    }
  }

  return qualities;
}

async function analyzeRoutes(): Promise<QualityReport> {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  });

  const apiRoutes = project.addSourceFilesAtPaths('src/app/api/**/route.ts');
  const pages = project.addSourceFilesAtPaths('src/app/**/page.tsx');
  const allFiles = [...apiRoutes, ...pages];

  const allQualities: RouteQuality[] = [];

  for (const file of allFiles) {
    const filePath = file.getFilePath();
    const qualities = analyzeFile(filePath, project);
    allQualities.push(...qualities);
  }

  // Calculate statistics
  const entityDistribution: Record<string, number> = {};
  const fieldCoverage: Record<keyof FieldPresence, number> = {
    route: 0,
    entity: 0,
    description: 0,
    permissions: 0,
    params: 0,
    query: 0,
    relationships: 0,
    energyCost: 0,
    dimensions: 0,
    example: 0,
    agentDiscoverable: 0,
  };

  let totalCompleteness = 0;
  let agentDiscoverableCount = 0;

  for (const quality of allQualities) {
    // Entity distribution
    entityDistribution[quality.entity] = (entityDistribution[quality.entity] || 0) + 1;

    // Field coverage
    for (const [field, present] of Object.entries(quality.fields)) {
      if (present) {
        fieldCoverage[field as keyof FieldPresence]++;
      }
    }

    // Agent discoverable count
    if (quality.fields.agentDiscoverable) {
      agentDiscoverableCount++;
    }

    // Total completeness
    totalCompleteness += quality.completeness;
  }

  const averageCompleteness = allQualities.length > 0
    ? Math.round(totalCompleteness / allQualities.length)
    : 0;

  // Convert field coverage to percentages
  const fieldCoveragePercent: Record<keyof FieldPresence, number> = {} as any;
  for (const [field, count] of Object.entries(fieldCoverage)) {
    fieldCoveragePercent[field as keyof FieldPresence] = allQualities.length > 0
      ? Math.round((count / allQualities.length) * 100)
      : 0;
  }

  // Sort by priority and completeness
  const highPriority = allQualities
    .filter(q => q.priority === 'high')
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 20);

  const mediumPriority = allQualities
    .filter(q => q.priority === 'medium')
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 20);

  const topQuality = allQualities
    .filter(q => q.completeness === 100)
    .slice(0, 10);

  return {
    totalRoutes: allQualities.length,
    averageCompleteness,
    entityDistribution,
    agentDiscoverableCount,
    fieldCoverage: fieldCoveragePercent,
    highPriorityImprovements: highPriority,
    mediumPriorityImprovements: mediumPriority,
    topQualityRoutes: topQuality,
  };
}

function printReport(report: QualityReport) {
  console.log('\n📊 Annotation Quality Report\n');

  console.log(`Total routes analyzed: ${report.totalRoutes}`);
  console.log(`Average completeness: ${report.averageCompleteness}%`);
  console.log(`Agent discoverable: ${report.agentDiscoverableCount} (${Math.round((report.agentDiscoverableCount / report.totalRoutes) * 100)}%)\n`);

  console.log('🏷️  Entity Distribution:');
  const sortedEntities = Object.entries(report.entityDistribution).sort((a, b) => b[1] - a[1]);
  for (const [entity, count] of sortedEntities) {
    const percentage = Math.round((count / report.totalRoutes) * 100);
    console.log(`  ${entity.padEnd(10)} ${count.toString().padStart(3)} (${percentage}%)`);
  }
  console.log('');

  console.log('📋 Field Coverage:');
  const sortedFields = Object.entries(report.fieldCoverage).sort((a, b) => b[1] - a[1]);
  for (const [field, percentage] of sortedFields) {
    const bar = '█'.repeat(Math.floor(percentage / 5));
    console.log(`  ${field.padEnd(20)} ${percentage.toString().padStart(3)}% ${bar}`);
  }
  console.log('');

  if (report.highPriorityImprovements.length > 0) {
    console.log(`🔴 High Priority Improvements (${report.highPriorityImprovements.length}):`);
    for (const quality of report.highPriorityImprovements.slice(0, 10)) {
      console.log(`  ${quality.file}:${quality.lineNumber}`);
      console.log(`    Completeness: ${quality.completeness}% | Entity: ${quality.entity}`);
      for (const rec of quality.recommendations) {
        console.log(`    - ${rec}`);
      }
    }
    if (report.highPriorityImprovements.length > 10) {
      console.log(`  ... and ${report.highPriorityImprovements.length - 10} more`);
    }
    console.log('');
  }

  if (report.mediumPriorityImprovements.length > 0) {
    console.log(`🟡 Medium Priority Improvements (${report.mediumPriorityImprovements.length}):`);
    for (const quality of report.mediumPriorityImprovements.slice(0, 5)) {
      console.log(`  ${quality.file}:${quality.lineNumber} (${quality.completeness}%)`);
    }
    if (report.mediumPriorityImprovements.length > 5) {
      console.log(`  ... and ${report.mediumPriorityImprovements.length - 5} more`);
    }
    console.log('');
  }

  if (report.topQualityRoutes.length > 0) {
    console.log(`✨ Top Quality Routes (100% complete): ${report.topQualityRoutes.length} total`);
    console.log('');
  }

  console.log('💡 Recommendations:');
  const relationshipCoverage = report.fieldCoverage.relationships;
  const dimensionsCoverage = report.fieldCoverage.dimensions;
  const exampleCoverage = report.fieldCoverage.example;

  if (relationshipCoverage < 80) {
    console.log(`  - Add @relationships to ${Math.round(report.totalRoutes * (100 - relationshipCoverage) / 100)} routes for provenance tracking`);
  }
  if (dimensionsCoverage < 80) {
    console.log(`  - Add @dimensions to ${Math.round(report.totalRoutes * (100 - dimensionsCoverage) / 100)} routes for 5D ontology`);
  }
  if (exampleCoverage < 90) {
    console.log(`  - Add @example to ${Math.round(report.totalRoutes * (100 - exampleCoverage) / 100)} routes for documentation`);
  }
}

// Main execution
const jsonOutput = process.argv.includes('--json');

analyzeRoutes()
  .then(report => {
    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }
  })
  .catch(error => {
    console.error('❌ Analysis error:', error);
    process.exit(1);
  });
