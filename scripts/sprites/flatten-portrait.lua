-- flatten-portrait.lua
-- LibreSprite batch script: merge 5 portrait layers into single 64x64 PNG
-- Usage: libresprite --batch --script flatten-portrait.lua \
--          --script-param input=/path/to/layers/dir \
--          --script-param output=/path/to/output.png
--
-- Layer order (bottom to top): base, nation_body, archetype_outfit, nation_accent, archetype_accent

local input_dir = app.params["input"]
local output_path = app.params["output"]
local layers = {"base", "nation_body", "archetype_outfit", "nation_accent", "archetype_accent"}

-- Create a new 64x64 RGBA sprite
local spr = Sprite(64, 64, ColorMode.RGB)
spr:assignColorSpace(ColorSpace{ sRGB=true })

-- Load and composite each layer
for i, layer_name in ipairs(layers) do
    local png_path = input_dir .. "/" .. layer_name .. ".png"
    local layer_spr = app.open(png_path)
    if layer_spr then
        -- Copy pixels from layer sprite onto our composite
        local src_cel = layer_spr.cels[1]
        if src_cel then
            local new_layer = spr:newLayer()
            new_layer.name = layer_name
            local new_cel = spr:newCel(new_layer, spr.frames[1], src_cel.image, src_cel.position)
        end
        layer_spr:close()
    else
        app.alert("Warning: layer not found: " .. png_path)
    end
end

-- Flatten all layers
spr:flatten()

-- Export to output path
spr:saveCopyAs(output_path)
spr:close()

app.alert("Flattened portrait saved to: " .. output_path)
