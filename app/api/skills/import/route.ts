import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

interface ParsedSkill {
  name: string;
  description: string;
  template: string;
  category: string;
  icon?: string;
}

// Parse a SKILL.md file content
function parseSkillMd(content: string, filename: string): ParsedSkill | null {
  try {
    const lines = content.split('\n');
    let name = '';
    let description = '';
    let category = 'Other';
    let template = '';
    let inTemplate = false;
    let templateLines: string[] = [];

    for (const line of lines) {
      // Parse name from # heading or name: field
      if (line.startsWith('# ') && !name) {
        name = line.replace('# ', '').trim();
      } else if (line.toLowerCase().startsWith('name:')) {
        name = line.replace(/^name:\s*/i, '').trim();
      }
      // Parse description
      else if (line.toLowerCase().startsWith('description:')) {
        description = line.replace(/^description:\s*/i, '').trim();
      }
      // Parse category
      else if (line.toLowerCase().startsWith('category:')) {
        category = line.replace(/^category:\s*/i, '').trim();
      }
      // Handle template section
      else if (line.toLowerCase().includes('## template') || line.toLowerCase().includes('## prompt')) {
        inTemplate = true;
      }
      // Handle code blocks
      else if (line.startsWith('```') && inTemplate) {
        // Skip code block markers
        continue;
      }
      // Collect template content
      else if (inTemplate) {
        templateLines.push(line);
      }
      // If no explicit template section, collect content after metadata
      else if (name && description && !inTemplate && line.trim() && !line.includes(':')) {
        templateLines.push(line);
      }
    }

    template = templateLines.join('\n').trim();

    // If no template found, use the whole content after the first heading
    if (!template) {
      const firstHeadingIndex = content.indexOf('\n');
      if (firstHeadingIndex !== -1) {
        template = content.slice(firstHeadingIndex + 1).trim();
      }
    }

    // Extract name from filename if not found
    if (!name) {
      name = filename
        .replace(/\.md$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    if (!description) {
      description = `Imported skill: ${name}`;
    }

    // Determine icon based on category or name
    const icon = getIconForSkill(name, category);

    return {
      name,
      description,
      template: template || 'You are an expert assistant...',
      category,
      icon
    };
  } catch (error) {
    console.error('Error parsing skill md:', error);
    return null;
  }
}

function getIconForSkill(name: string, category: string): string {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes('data') || lowerName.includes('data') || lowerName.includes('analytics')) {
    return '📊';
  }
  if (lowerCategory.includes('develop') || lowerName.includes('code') || lowerName.includes('api')) {
    return '💻';
  }
  if (lowerCategory.includes('writing') || lowerName.includes('write') || lowerName.includes('content')) {
    return '✍️';
  }
  if (lowerCategory.includes('marketing') || lowerName.includes('marketing')) {
    return '📢';
  }
  if (lowerCategory.includes('design') || lowerName.includes('design')) {
    return '🎨';
  }
  if (lowerCategory.includes('research') || lowerName.includes('research')) {
    return '🔬';
  }
  if (lowerCategory.includes('product') || lowerName.includes('product')) {
    return '📦';
  }
  return '⚙️';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const email = formData.get('email') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const skills: ParsedSkill[] = [];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Handle .md files
    if (file.name.toLowerCase().endsWith('.md')) {
      const content = buffer.toString('utf-8');
      const skill = parseSkillMd(content, file.name);
      if (skill) {
        skills.push(skill);
      }
    }
    // Handle .zip files
    else if (file.name.toLowerCase().endsWith('.zip')) {
      const zip = await JSZip.loadAsync(buffer);

      // Process each file in the zip
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;

        // Only process .md files
        if (filename.toLowerCase().endsWith('.md')) {
          const content = await zipEntry.async('string');
          const skill = parseSkillMd(content, filename);
          if (skill) {
            skills.push(skill);
          }
        }
        // Check for skill.json manifest
        else if (filename.toLowerCase() === 'skill.json' || filename.toLowerCase().endsWith('/skill.json')) {
          try {
            const content = await zipEntry.async('string');
            const manifest = JSON.parse(content);

            // Handle single skill manifest
            if (manifest.name && manifest.template) {
              skills.push({
                name: manifest.name,
                description: manifest.description || `Imported skill: ${manifest.name}`,
                template: manifest.template,
                category: manifest.category || 'Other',
                icon: manifest.icon || getIconForSkill(manifest.name, manifest.category || '')
              });
            }
            // Handle multiple skills in manifest
            else if (Array.isArray(manifest.skills)) {
              for (const s of manifest.skills) {
                if (s.name && s.template) {
                  skills.push({
                    name: s.name,
                    description: s.description || `Imported skill: ${s.name}`,
                    template: s.template,
                    category: s.category || 'Other',
                    icon: s.icon || getIconForSkill(s.name, s.category || '')
                  });
                }
              }
            }
          } catch (e) {
            console.error('Error parsing skill.json:', e);
          }
        }
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported file type. Please upload .md or .zip files.'
      }, { status: 400 });
    }

    if (skills.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid skills found in the uploaded file'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      skills,
      message: `Successfully parsed ${skills.length} skill(s)`
    });
  } catch (error) {
    console.error('Error processing skill import:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process uploaded file'
    }, { status: 500 });
  }
}
