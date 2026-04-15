"""
WYSIWYG Website Builder - FastAPI Backend
Enhanced with image upload, more components, and better templates
"""

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent.absolute()

app = FastAPI(title="Pop Locate")

# Mount static files using absolute paths
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/uploads", StaticFiles(directory=str(BASE_DIR / "static" / "uploads")), name="uploads")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Data storage using absolute paths
PROJECTS_DIR = str(BASE_DIR / "projects")
UPLOADS_DIR = str(BASE_DIR / "static" / "uploads")
os.makedirs(PROJECTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Allowed image types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB

# Models
class Component(BaseModel):
    id: str
    type: str
    props: Dict[str, Any]
    children: List['Component'] = []
    style: Dict[str, Any] = {}

class Page(BaseModel):
    id: str
    name: str
    components: List[Component]
    meta: Dict[str, Any] = {}

class Project(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str
    pages: List[Page]
    settings: Dict[str, Any] = {}

# Routes
@app.get("/", response_class=HTMLResponse)
async def editor(request: Request):
    return templates.TemplateResponse("editor.html", {"request": request})

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/projects")
async def list_projects():
    """List all projects with error handling"""
    try:
        projects = []
        if not os.path.exists(PROJECTS_DIR):
            os.makedirs(PROJECTS_DIR, exist_ok=True)
            return []
        
        for filename in os.listdir(PROJECTS_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(PROJECTS_DIR, filename)
                try:
                    with open(filepath, 'r') as f:
                        projects.append(json.load(f))
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Error loading project {filename}: {e}")
                    continue
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(e)}")

@app.post("/api/projects")
async def create_project(project: Project):
    """Create a new project with validation"""
    try:
        if not project.name or len(project.name.strip()) == 0:
            raise HTTPException(status_code=400, detail="Project name is required")
        
        project.id = str(uuid.uuid4())
        project.created_at = datetime.now().isoformat()
        project.updated_at = project.created_at
        
        filepath = os.path.join(PROJECTS_DIR, f"{project.id}.json")
        with open(filepath, "w") as f:
            json.dump(project.dict(), f, indent=2)
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get a project by ID with validation"""
    try:
        # Validate project_id format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Project not found")
        
        with open(filepath, 'r') as f:
            return json.load(f)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load project: {str(e)}")

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project: Project):
    """Update a project with validation"""
    try:
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not project.name or len(project.name.strip()) == 0:
            raise HTTPException(status_code=400, detail="Project name is required")
        
        project.updated_at = datetime.now().isoformat()
        with open(filepath, "w") as f:
            json.dump(project.dict(), f, indent=2)
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project with validation"""
    try:
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if os.path.exists(filepath):
            os.remove(filepath)
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file with validation"""
    try:
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
            )
        
        # Validate file extension
        ext = Path(file.filename).suffix.lower()
        allowed_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
        if ext not in allowed_exts:
            raise HTTPException(status_code=400, detail="Invalid file extension")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(UPLOADS_DIR, unique_filename)
        
        # Save file
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Check file size after save
        file_size = os.path.getsize(filepath)
        if file_size > MAX_IMAGE_SIZE:
            os.remove(filepath)
            raise HTTPException(status_code=400, detail="File too large. Maximum size: 10MB")
        
        return {
            "filename": unique_filename,
            "url": f"/uploads/{unique_filename}",
            "size": file_size
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/uploads")
async def list_uploads():
    """List all uploaded images"""
    try:
        uploads = []
        if os.path.exists(UPLOADS_DIR):
            for filename in os.listdir(UPLOADS_DIR):
                filepath = os.path.join(UPLOADS_DIR, filename)
                if os.path.isfile(filepath):
                    stat = os.stat(filepath)
                    uploads.append({
                        "filename": filename,
                        "url": f"/uploads/{filename}",
                        "size": stat.st_size,
                        "created": datetime.fromtimestamp(stat.st_ctime).isoformat()
                    })
        return sorted(uploads, key=lambda x: x["created"], reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list uploads: {str(e)}")

@app.delete("/api/uploads/{filename}")
async def delete_upload(filename: str):
    """Delete an uploaded image"""
    try:
        # Validate filename (prevent directory traversal)
        if ".." in filename or "/" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        filepath = os.path.join(UPLOADS_DIR, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return {"status": "deleted"}
        raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@app.post("/api/projects/{project_id}/export")
async def export_project(project_id: str, format: str = "html"):
    """Export project as static HTML/CSS files with error handling"""
    try:
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        
        filepath = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Project not found")
        
        with open(filepath, 'r') as f:
            project = json.load(f)
        
        # Generate HTML
        html_content = generate_static_html(project)
        
        # Save to exports using absolute path
        export_dir = BASE_DIR / "exports" / project_id
        export_dir.mkdir(parents=True, exist_ok=True)
        
        export_file = export_dir / "index.html"
        with open(export_file, "w") as f:
            f.write(html_content)
        
        if format == "zip":
            # Create ZIP file
            zip_path = BASE_DIR / "exports" / f"{project_id}.zip"
            import zipfile
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(export_file, "index.html")
            return {"export_url": f"/exports/{project_id}.zip", "format": "zip"}
        
        return {"export_url": f"/exports/{project_id}/index.html", "format": "html"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.get("/exports/{project_id}/index.html")
async def serve_export(project_id: str):
    """Serve exported HTML file"""
    try:
        uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")
    
    filepath = BASE_DIR / "exports" / project_id / "index.html"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Export not found")
    
    return FileResponse(str(filepath))

@app.get("/exports/{filename}")
async def serve_export_zip(filename: str):
    """Serve exported ZIP file"""
    filepath = BASE_DIR / "exports" / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Export not found")
    
    return FileResponse(str(filepath), media_type="application/zip")

def generate_static_html(project: Dict) -> str:
    """Generate static HTML from project with full styles and animations"""
    pages = project.get("pages", [])
    if not pages:
        return "<html><body>No pages</body></html>"
    
    page = pages[0]  # Export first page
    components_html = ""
    
    for comp in page.get("components", []):
        components_html += render_component(comp)
    
    # Create exports directory if it doesn't exist
    exports_dir = BASE_DIR / "exports"
    exports_dir.mkdir(exist_ok=True)
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page.get('name', 'Untitled')}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{ 
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
        }}
        
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        
        /* Animations */
        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}
        
        @keyframes slideUp {{
            from {{ transform: translateY(30px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}
        
        @keyframes slideInLeft {{
            from {{ transform: translateX(-30px); opacity: 0; }}
            to {{ transform: translateX(0); opacity: 1; }}
        }}
        
        @keyframes slideInRight {{
            from {{ transform: translateX(30px); opacity: 0; }}
            to {{ transform: translateX(0); opacity: 1; }}
        }}
        
        @keyframes scaleIn {{
            from {{ transform: scale(0.9); opacity: 0; }}
            to {{ transform: scale(1); opacity: 1; }}
        }}
        
        @keyframes bounce {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-10px); }}
        }}
        
        .animate-fadeIn {{ animation: fadeIn 0.6s ease forwards; }}
        .animate-slideUp {{ animation: slideUp 0.6s ease forwards; }}
        .animate-slideInLeft {{ animation: slideInLeft 0.6s ease forwards; }}
        .animate-slideInRight {{ animation: slideInRight 0.6s ease forwards; }}
        .animate-scaleIn {{ animation: scaleIn 0.5s ease forwards; }}
        .animate-bounce {{ animation: bounce 2s infinite; }}
        
        .delay-100 {{ animation-delay: 0.1s; }}
        .delay-200 {{ animation-delay: 0.2s; }}
        .delay-300 {{ animation-delay: 0.3s; }}
        .delay-400 {{ animation-delay: 0.4s; }}
        .delay-500 {{ animation-delay: 0.5s; }}
        
        /* Hover effects */
        .hover-lift {{ transition: transform 0.2s, box-shadow 0.2s; }}
        .hover-lift:hover {{ transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }}
        
        .hover-scale {{ transition: transform 0.2s; }}
        .hover-scale:hover {{ transform: scale(1.02); }}
        
        .hover-glow {{ transition: box-shadow 0.2s; }}
        .hover-glow:hover {{ box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }}
        
        /* Component styles */
        .wysiwyg-navbar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            background: #0f172a;
            color: white;
        }}
        
        .wysiwyg-hero {{
            padding: 80px 40px;
            text-align: center;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
        }}
        
        .wysiwyg-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
        }}
        
        .wysiwyg-card {{
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 24px;
        }}
        
        .wysiwyg-button {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
        }}
        
        .wysiwyg-button:hover {{
            background: #4f46e5;
            transform: translateY(-2px);
        }}
        
        /* Carousel */
        .wysiwyg-carousel {{
            position: relative;
            overflow: hidden;
            border-radius: 8px;
        }}
        
        .carousel-track {{
            display: flex;
            transition: transform 0.5s ease;
        }}
        
        .carousel-slide {{
            min-width: 100%;
            padding: 40px;
            text-align: center;
        }}
        
        .carousel-nav {{
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            padding: 12px;
            cursor: pointer;
            border-radius: 50%;
        }}
        
        .carousel-prev {{ left: 10px; }}
        .carousel-next {{ right: 10px; }}
        
        /* Tabs */
        .wysiwyg-tabs {{
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }}
        
        .tabs-header {{
            display: flex;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }}
        
        .tab-button {{
            flex: 1;
            padding: 12px 20px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }}
        
        .tab-button.active {{
            background: white;
            color: #6366f1;
            border-bottom: 2px solid #6366f1;
        }}
        
        .tab-content {{
            display: none;
            padding: 20px;
        }}
        
        .tab-content.active {{
            display: block;
        }}
        
        /* Accordion */
        .wysiwyg-accordion {{
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }}
        
        .accordion-item {{
            border-bottom: 1px solid #e2e8f0;
        }}
        
        .accordion-item:last-child {{
            border-bottom: none;
        }}
        
        .accordion-header {{
            width: 100%;
            padding: 16px 20px;
            background: white;
            border: none;
            text-align: left;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .accordion-content {{
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }}
        
        .accordion-content.open {{
            max-height: 500px;
            padding: 0 20px 16px;
        }}
        
        /* Testimonial */
        .wysiwyg-testimonial {{
            text-align: center;
            padding: 40px;
        }}
        
        .testimonial-avatar {{
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin-bottom: 16px;
            object-fit: cover;
        }}
        
        .testimonial-quote {{
            font-size: 1.125rem;
            font-style: italic;
            color: #475569;
            margin-bottom: 16px;
        }}
        
        .testimonial-author {{
            font-weight: 600;
            color: #0f172a;
        }}
        
        /* Pricing */
        .wysiwyg-pricing {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }}
        
        .pricing-card {{
            background: white;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            border: 2px solid #e2e8f0;
            transition: all 0.2s;
        }}
        
        .pricing-card.featured {{
            border-color: #6366f1;
            transform: scale(1.05);
        }}
        
        .pricing-amount {{
            font-size: 3rem;
            font-weight: 700;
            color: #0f172a;
        }}
        
        .pricing-period {{
            color: #64748b;
        }}
        
        .pricing-features {{
            list-style: none;
            padding: 0;
            margin: 24px 0;
        }}
        
        .pricing-features li {{
            padding: 8px 0;
            color: #475569;
        }}
        
        /* Progress Bar */
        .wysiwyg-progress {{
            background: #e2e8f0;
            border-radius: 999px;
            overflow: hidden;
            height: 24px;
        }}
        
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            border-radius: 999px;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
        }}
        
        /* Badge */
        .wysiwyg-badge {{
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.875rem;
            font-weight: 500;
        }}
        
        /* Icon */
        .wysiwyg-icon {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }}
        
        /* Responsive */
        @media (max-width: 768px) {{
            .wysiwyg-grid {{
                grid-template-columns: 1fr;
            }}
            
            .wysiwyg-hero {{
                padding: 60px 20px;
            }}
            
            .wysiwyg-hero h1 {{
                font-size: 32px !important;
            }}
            
            .pricing-card.featured {{
                transform: none;
            }}
        }}
    </style>
</head>
<body>
    {components_html}
    <script>
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {{
            anchor.addEventListener('click', function (e) {{
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {{
                    target.scrollIntoView({{ behavior: 'smooth' }});
                }}
            }});
        }});
        
        // Carousel functionality
        document.querySelectorAll('.wysiwyg-carousel').forEach(carousel => {{
            const track = carousel.querySelector('.carousel-track');
            const slides = carousel.querySelectorAll('.carousel-slide');
            const prevBtn = carousel.querySelector('.carousel-prev');
            const nextBtn = carousel.querySelector('.carousel-next');
            if (!track || slides.length === 0) return;
            
            let currentSlide = 0;
            
            function updateCarousel() {{
                track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
            }}
            
            if (prevBtn) prevBtn.addEventListener('click', () => {{
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                updateCarousel();
            }});
            
            if (nextBtn) nextBtn.addEventListener('click', () => {{
                currentSlide = (currentSlide + 1) % slides.length;
                updateCarousel();
            }});
        }});
        
        // Tabs functionality
        document.querySelectorAll('.wysiwyg-tabs').forEach(tabs => {{
            const buttons = tabs.querySelectorAll('.tab-button');
            const contents = tabs.querySelectorAll('.tab-content');
            
            buttons.forEach((btn, index) => {{
                btn.addEventListener('click', () => {{
                    buttons.forEach(b => b.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    if (contents[index]) contents[index].classList.add('active');
                }});
            }});
        }});
        
        // Accordion functionality
        document.querySelectorAll('.wysiwyg-accordion').forEach(accordion => {{
            const headers = accordion.querySelectorAll('.accordion-header');
            
            headers.forEach(header => {{
                header.addEventListener('click', () => {{
                    const content = header.nextElementSibling;
                    const isOpen = content.classList.contains('open');
                    
                    // Close all
                    accordion.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
                    
                    // Open clicked if it was closed
                    if (!isOpen) content.classList.add('open');
                }});
            }});
        }});
    </script>
</body>
</html>"""

def render_component(comp: Dict) -> str:
    """Render a component to HTML with classes and styles"""
    comp_type = comp.get("type", "div")
    props = comp.get("props", {})
    style = comp.get("style", {})
    children = comp.get("children", [])
    classes = comp.get("classes", [])
    
    style_str = "; ".join(f"{k}: {v}" for k, v in style.items())
    class_str = " ".join([f"wysiwyg-{comp_type}"] + classes)
    
    if comp_type == "text":
        content = props.get("content", "Text")
        tag = props.get("tag", "p")
        return f"<{tag} class='{class_str}' style='{style_str}'>{content}</{tag}>"
    
    elif comp_type == "heading":
        content = props.get("content", "Heading")
        level = props.get("level", "h2")
        return f"<{level} class='{class_str}' style='{style_str}'>{content}</{level}>"
    
    elif comp_type == "button":
        label = props.get("label", "Button")
        url = props.get("url", "#")
        return f"<a href='{url}' class='{class_str}' style='{style_str}'>{label}</a>"
    
    elif comp_type == "image":
        src = props.get("src", "https://via.placeholder.com/400x300")
        alt = props.get("alt", "")
        return f"<img src='{src}' alt='{alt}' class='{class_str}' style='{style_str}' />"
    
    elif comp_type == "container":
        children_html = "".join(render_component(c) for c in children)
        return f"<div class='{class_str}' style='{style_str}'>{children_html}</div>"
    
    elif comp_type == "card":
        children_html = "".join(render_component(c) for c in children)
        return f"<div class='{class_str}' style='{style_str}'>{children_html}</div>"
    
    elif comp_type == "grid":
        children_html = "".join(render_component(c) for c in children)
        return f"<div class='{class_str}' style='{style_str}'>{children_html}</div>"
    
    elif comp_type == "navbar":
        brand = props.get("brand", "Brand")
        links = props.get("links", [{"label": "Home", "url": "#home"}, {"label": "About", "url": "#about"}, {"label": "Contact", "url": "#contact"}])
        links_html = "".join([f'<a href="{link["url"]}" style="color: white; text-decoration: none;">{link["label"]}</a>' for link in links])
        return f"""
        <nav class='{class_str}' style='{style_str}'>
            <span style="font-weight: 700; font-size: 1.25rem;">{brand}</span>
            <div style="display: flex; gap: 24px;">
                {links_html}
            </div>
        </nav>
        """
    
    elif comp_type == "hero":
        title = props.get("title", "Welcome")
        subtitle = props.get("subtitle", "Subtitle here")
        return f"""
        <section class='{class_str}' style='{style_str}'>
            <h1 style="font-size: 48px; margin-bottom: 16px;">{title}</h1>
            <p style="font-size: 20px; opacity: 0.9;">{subtitle}</p>
        </section>
        """
    
    elif comp_type == "divider":
        return f"<hr class='{class_str}' style='{style_str}'>"
    
    elif comp_type == "spacer":
        return f"<div class='{class_str}' style='{style_str}'></div>"
    
    elif comp_type == "video":
        url = props.get("url", "")
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <iframe src="{url}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
        </div>
        """
    
    elif comp_type == "form":
        title = props.get("title", "")
        submit_text = props.get("submitText", "Submit")
        title_html = f"<h3 style='margin-bottom: 20px;'>{title}</h3>" if title else ""
        return f"""
        <form class='{class_str}' style='{style_str}'>
            {title_html}
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Name</label>
                <input type="text" placeholder="Your name" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Email</label>
                <input type="email" placeholder="your@email.com" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Message</label>
                <textarea placeholder="Your message..." rows="4" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; resize: vertical;"></textarea>
            </div>
            <button type="submit" class="wysiwyg-button">{submit_text}</button>
        </form>
        """
    
    elif comp_type == "map":
        address = props.get("address", "")
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <div style="text-align: center;">
                <i class="fas fa-map-marked-alt" style="font-size: 48px; color: #94a3b8; margin-bottom: 12px;"></i>
                <p style="color: #64748b;">{address}</p>
            </div>
        </div>
        """
    
    elif comp_type == "social":
        platforms = props.get("platforms", ["twitter", "facebook", "instagram"])
        icons = {"twitter": "fa-twitter", "facebook": "fa-facebook-f", "instagram": "fa-instagram", 
                 "linkedin": "fa-linkedin-in", "youtube": "fa-youtube", "github": "fa-github"}
        links_html = "".join([f'<a href="#" style="width: 40px; height: 40px; background: #e2e8f0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #64748b; text-decoration: none; margin: 0 8px; transition: all 0.2s;"><i class="fab {icons.get(p, "fa-share")}"></i></a>' for p in platforms])
        return f"<div class='{class_str}' style='{style_str}'>{links_html}</div>"
    
    elif comp_type == "carousel":
        slides = props.get("slides", [{"title": "Slide 1", "content": "Content"}])
        slides_html = "".join([f'<div class="carousel-slide"><h3>{s.get("title", "")}</h3><p>{s.get("content", "")}</p></div>' for s in slides])
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <div class="carousel-track">{slides_html}</div>
            <button class="carousel-nav carousel-prev"><i class="fas fa-chevron-left"></i></button>
            <button class="carousel-nav carousel-next"><i class="fas fa-chevron-right"></i></button>
        </div>
        """
    
    elif comp_type == "tabs":
        tabs = props.get("tabs", [{"label": "Tab 1", "content": "Content"}])
        tabs_html = "".join([f'<button class="tab-button {"active" if i==0 else ""}">{t.get("label", "")}</button>' for i, t in enumerate(tabs)])
        contents_html = "".join([f'<div class="tab-content {"active" if i==0 else ""}">{t.get("content", "")}</div>' for i, t in enumerate(tabs)])
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <div class="tabs-header">{tabs_html}</div>
            {contents_html}
        </div>
        """
    
    elif comp_type == "accordion":
        items = props.get("items", [{"title": "Item 1", "content": "Content"}])
        items_html = "".join([f'<div class="accordion-item"><button class="accordion-header">{i.get("title", "")}<i class="fas fa-chevron-down"></i></button><div class="accordion-content">{i.get("content", "")}</div></div>' for i in items])
        return f"""
        <div class='{class_str}' style='{style_str}'>
            {items_html}
        </div>
        """
    
    elif comp_type == "testimonial":
        quote = props.get("quote", "Great product!")
        author = props.get("author", "John Doe")
        role = props.get("role", "Customer")
        avatar = props.get("avatar", "https://via.placeholder.com/80")
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <img src="{avatar}" alt="{author}" class="testimonial-avatar">
            <p class="testimonial-quote">"{quote}"</p>
            <p class="testimonial-author">{author}</p>
            <p style="color: #64748b;">{role}</p>
        </div>
        """
    
    elif comp_type == "pricing":
        title = props.get("title", "Basic")
        price = props.get("price", "$9")
        period = props.get("period", "/month")
        features = props.get("features", ["Feature 1", "Feature 2"])
        featured = props.get("featured", False)
        cta_text = props.get("ctaText", "Get Started")
        features_html = "".join([f'<li><i class="fas fa-check" style="color: #22c55e; margin-right: 8px;"></i>{f}</li>' for f in features])
        featured_class = "featured" if featured else ""
        return f"""
        <div class='pricing-card {featured_class} {class_str}' style='{style_str}'>
            <h3 style="margin-bottom: 16px;">{title}</h3>
            <div class="pricing-amount">{price}</div>
            <div class="pricing-period">{period}</div>
            <ul class="pricing-features">{features_html}</ul>
            <a href="#" class="wysiwyg-button">{cta_text}</a>
        </div>
        """
    
    elif comp_type == "progress":
        value = props.get("value", 50)
        label = props.get("label", "")
        show_percentage = props.get("showPercentage", True)
        percentage_text = f"{value}%" if show_percentage else ""
        return f"""
        <div class='{class_str}' style='{style_str}'>
            {f'<div style="margin-bottom: 8px; font-weight: 500;">{label}</div>' if label else ''}
            <div class="wysiwyg-progress">
                <div class="progress-fill" style="width: {value}%">{percentage_text}</div>
            </div>
        </div>
        """
    
    elif comp_type == "badge":
        text = props.get("text", "New")
        variant = props.get("variant", "primary")
        colors = {
            "primary": "#6366f1",
            "success": "#22c55e",
            "warning": "#f59e0b",
            "danger": "#ef4444",
            "info": "#3b82f6"
        }
        bg_color = colors.get(variant, colors["primary"])
        return f"""
        <span class='{class_str}' style='background: {bg_color}20; color: {bg_color}; {style_str}'>{text}</span>
        """
    
    elif comp_type == "icon":
        icon_name = props.get("icon", "star")
        size = props.get("size", "24px")
        return f"""
        <div class='{class_str}' style='font-size: {size}; {style_str}'>
            <i class="fas fa-{icon_name}"></i>
        </div>
        """
    
    # New component types for export
    elif comp_type == "timeline":
        items = props.get("items", [])
        items_html = "".join([f"""
        <div class="timeline-item {'right' if i % 2 else 'left'}">
            <div class="timeline-content">
                <div class="timeline-year">{item.get('year', '')}</div>
                <h4>{item.get('title', '')}</h4>
                <p>{item.get('description', '')}</p>
            </div>
        </div>
        """ for i, item in enumerate(items)])
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <div class="timeline-container">
                {items_html}
            </div>
        </div>
        """
    
    elif comp_type == "stats":
        stats = props.get("stats", [])
        stats_html = "".join([f"""
        <div class="stat-item">
            <div class="stat-value">{stat.get('value', '')}</div>
            <div class="stat-label">{stat.get('label', '')}</div>
        </div>
        """ for stat in stats])
        return f"""
        <div class='{class_str}' style='{style_str}'>
            {stats_html}
        </div>
        """
    
    elif comp_type == "team":
        name = props.get("name", "Team Member")
        role = props.get("role", "Role")
        bio = props.get("bio", "")
        image = props.get("image", "https://via.placeholder.com/150")
        social = props.get("social", {})
        social_html = ""
        if social.get("linkedin"):
            social_html += f'<a href="{social["linkedin"]}" style="color: #0077b5;"><i class="fab fa-linkedin fa-lg"></i></a>'
        if social.get("twitter"):
            social_html += f'<a href="{social["twitter"]}" style="color: #1da1f2;"><i class="fab fa-twitter fa-lg"></i></a>'
        return f"""
        <div class='{class_str}' style='{style_str}'>
            <img src="{image}" alt="{name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 16px;">
            <h3 style="margin: 0 0 4px;">{name}</h3>
            <p style="color: #6366f1; font-weight: 500; margin-bottom: 8px;">{role}</p>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 16px;">{bio}</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                {social_html}
            </div>
        </div>
        """
    
    elif comp_type == "cta":
        title = props.get("title", "Ready to Get Started?")
        subtitle = props.get("subtitle", "")
        button_text = props.get("buttonText", "Get Started")
        button_url = props.get("buttonUrl", "#")
        return f"""
        <section class='{class_str}' style='{style_str}'>
            <h2 style="font-size: 36px; margin-bottom: 16px;">{title}</h2>
            <p style="font-size: 18px; opacity: 0.9; margin-bottom: 32px;">{subtitle}</p>
            <a href="{button_url}" class="wysiwyg-button" style="font-size: 18px; padding: 16px 32px;">{button_text}</a>
        </section>
        """
    
    elif comp_type == "footer":
        brand = props.get("brand", "Your Brand")
        tagline = props.get("tagline", "")
        columns = props.get("columns", [])
        copyright = props.get("copyright", "")
        columns_html = "".join([f"""
        <div>
            <h4 style="color: white; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">{col.get('title', '')}</h4>
            <ul style="list-style: none; padding: 0; margin: 0;">
                {''.join([f'<li style="margin-bottom: 8px;"><a href="#" style="color: #94a3b8; text-decoration: none; font-size: 0.875rem;">{link}</a></li>' for link in col.get('links', [])])}
            </ul>
        </div>
        """ for col in columns])
        return f"""
        <footer class='{class_str}' style='{style_str}'>
            <div style="display: grid; grid-template-columns: 2fr repeat({len(columns)}, 1fr); gap: 40px; margin-bottom: 40px;">
                <div>
                    <h3 style="color: white; margin-bottom: 8px;">{brand}</h3>
                    <p style="font-size: 0.875rem; color: #94a3b8;">{tagline}</p>
                </div>
                {columns_html}
            </div>
            <div style="border-top: 1px solid #334155; padding-top: 24px; text-align: center; font-size: 0.875rem; color: #94a3b8;">
                {copyright}
            </div>
        </footer>
        """