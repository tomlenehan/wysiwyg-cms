# WYSIWYG Website Builder

A modern, drag-and-drop website builder with a FastAPI backend. Create beautiful websites without writing code.

![Version](https://img.shields.io/badge/version-3.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)

## Features

- **Drag & Drop Interface**: Intuitive visual editor for building websites
- **25+ Components**: Text, headings, buttons, images, cards, navigation, hero sections, grids, and more
- **Templates**: Pre-built templates for landing pages, portfolios, blogs, SaaS, restaurants, and more
- **Property Editing**: Customize colors, typography, spacing, borders, shadows, and more
- **Responsive Preview**: Test your design on desktop, tablet, and mobile
- **Undo/Redo**: Full history support with keyboard shortcuts
- **Export to HTML**: Download your website as a standalone HTML file
- **Dark Mode**: Toggle between light and dark canvas modes
- **Keyboard Shortcuts**: Power-user shortcuts for faster editing

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WYSIWYGProject
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python main.py
   # OR
   uvicorn main:app --reload
   ```

5. **Open in browser**
   Navigate to `http://localhost:8000`

### Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Or build and run manually**
   ```bash
   docker build -t wysiwyg-builder .
   docker run -p 8000:8000 -v $(pwd)/projects:/app/projects wysiwyg-builder
   ```

## Deployment

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect the Dockerfile and deploy
4. Your app will be available at the provided URL

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Select "Docker" as the environment
4. Deploy

### Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Deploy: `fly deploy`

### Docker Hub

1. Build the image: `docker build -t yourusername/wysiwyg-builder .`
2. Push to Docker Hub: `docker push yourusername/wysiwyg-builder`
3. Deploy on any container platform

## API Documentation

### Projects

#### List all projects
```http
GET /api/projects
```

#### Create a new project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "My Website",
  "pages": [...],
  "settings": {}
}
```

#### Get a project
```http
GET /api/projects/{project_id}
```

#### Update a project
```http
PUT /api/projects/{project_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "pages": [...]
}
```

#### Delete a project
```http
DELETE /api/projects/{project_id}
```

### Uploads

#### Upload an image
```http
POST /api/upload
Content-Type: multipart/form-data

file: <image-file>
```

#### List uploads
```http
GET /api/uploads
```

#### Delete an upload
```http
DELETE /api/uploads/{filename}
```

### Export

#### Export project as HTML
```http
POST /api/projects/{project_id}/export?format=html
```

#### Export project as ZIP
```http
POST /api/projects/{project_id}/export?format=zip
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save project |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + P` | Toggle preview mode |
| `Ctrl + E` | Export project |
| `Ctrl + N` | New project |
| `Ctrl + O` | Open project |
| `Ctrl + D` | Duplicate component |
| `Ctrl + C` | Copy component |
| `Ctrl + V` | Paste component |
| `Delete` / `Backspace` | Delete component |
| `Escape` | Deselect / Exit preview |
| `?` | Show keyboard shortcuts |
| `↑` / `↓` | Move component up/down |

## Components

### Layout
- Container
- Grid
- Card
- Spacer
- Divider

### Content
- Text
- Heading
- Button
- Image
- Icon
- Badge

### Sections
- Navbar
- Hero
- Footer

### Interactive
- Carousel
- Tabs
- Accordion
- Form

### Media
- Video
- Map
- Social Links

### Marketing
- Testimonial
- Pricing
- Progress Bar
- Timeline
- Stats
- Team Member
- Call to Action

## Project Structure

```
WYSIWYGProject/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── projects/             # Saved projects (created at runtime)
├── exports/              # Exported files (created at runtime)
├── static/
│   ├── editor.css        # Editor styles
│   ├── editor.js         # Editor JavaScript
│   └── uploads/          # Uploaded images
└── templates/
    └── editor.html       # Main editor template
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |
| `DEBUG` | Debug mode | `False` |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.
