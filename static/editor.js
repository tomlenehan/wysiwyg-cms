/**
 * WYSIWYG Website Builder - Complete Editor JavaScript v3.0
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    currentProject: null,
    currentProjectId: null,
    selectedComponents: new Set(),
    lastSelected: null,
    componentCounter: 0,
    isPreviewMode: false,
    history: [],
    historyIndex: -1,
    clipboard: null,
    isShiftPressed: false,
    isCtrlPressed: false,
    draggedElement: null,
    dragSource: null,
    autoSaveInterval: null,
    isDirty: false,
    darkMode: false
};

const MAX_HISTORY = 50;
const AUTO_SAVE_DELAY = 30000;

const iconList = [
    'star', 'heart', 'user', 'envelope', 'phone', 'map-marker-alt', 'calendar', 'clock',
    'search', 'home', 'cog', 'bell', 'bookmark', 'camera', 'check', 'times', 'plus', 'minus',
    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron-right', 'chevron-left',
    'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'github', 'dribbble', 'figma',
    'shopping-cart', 'credit-card', 'truck', 'tag', 'percent', 'gift', 'trophy', 'medal',
    'chart-line', 'chart-bar', 'chart-pie', 'database', 'server', 'cloud', 'wifi', 'battery-full',
    'sun', 'moon', 'cloud-sun', 'cloud-rain', 'snowflake', 'wind',
    'music', 'video', 'image', 'file', 'folder', 'download', 'upload', 'share', 'link',
    'lock', 'unlock', 'eye', 'eye-slash', 'edit', 'trash', 'copy', 'paste', 'cut',
    'bold', 'italic', 'underline', 'align-left', 'align-center', 'align-right', 'list',
    'quote-left', 'quote-right', 'code', 'terminal', 'laptop', 'mobile-alt', 'tablet-alt',
    'desktop', 'mouse', 'keyboard', 'print', 'save', 'undo', 'redo', 'sync', 'spinner',
    'rocket', 'shield-alt', 'bolt', 'paint-brush', 'bullhorn'
];

// ============================================
// COMPONENT TEMPLATES
// ============================================
const componentTemplates = {
    container: { type: 'container', tag: 'div', props: {}, style: { padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px' }, children: [], canNest: true },
    grid: { type: 'grid', tag: 'div', props: { columns: '3' }, style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, children: [], canNest: true },
    card: { type: 'card', tag: 'div', props: {}, style: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }, children: [], canNest: true },
    spacer: { type: 'spacer', tag: 'div', props: { height: '40px' }, style: { height: '40px' } },
    divider: { type: 'divider', tag: 'hr', props: {}, style: { height: '1px', backgroundColor: '#e2e8f0', border: 'none', margin: '24px 0' } },
    text: { type: 'text', tag: 'p', props: { content: 'Enter your text here' }, style: { fontSize: '16px', color: '#1e293b', lineHeight: '1.6' } },
    heading: { type: 'heading', tag: 'h2', props: { content: 'Heading', level: 'h2' }, style: { fontSize: '32px', color: '#0f172a', fontWeight: '700', marginBottom: '16px' } },
    button: { type: 'button', tag: 'a', props: { label: 'Click Me', url: '#' }, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', textDecoration: 'none' } },
    image: { type: 'image', tag: 'img', props: { src: 'https://via.placeholder.com/400x300', alt: 'Placeholder' }, style: { maxWidth: '100%', height: 'auto', borderRadius: '8px' } },
    icon: { type: 'icon', tag: 'div', props: { icon: 'star', size: '48px', color: '#6366f1' }, style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } },
    badge: { type: 'badge', tag: 'span', props: { text: 'New', variant: 'primary' }, style: { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '9999px', fontSize: '14px', fontWeight: '500' } },
    navbar: { type: 'navbar', tag: 'nav', props: { brand: 'My Website', links: [{ label: 'Home', url: '#home' }, { label: 'About', url: '#about' }, { label: 'Contact', url: '#contact' }] }, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#0f172a', color: '#ffffff' }, canNest: true },
    hero: { type: 'hero', tag: 'section', props: { title: 'Welcome', subtitle: 'Build something amazing' }, style: { padding: '80px 40px', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff' }, canNest: true },
    footer: { type: 'footer', tag: 'footer', props: { brand: 'Your Brand', tagline: 'Building the future', copyright: '2024 Your Brand. All rights reserved.' }, style: { padding: '60px 40px 30px', backgroundColor: '#0f172a', color: '#94a3b8' }, canNest: true },
    carousel: { type: 'carousel', tag: 'div', props: { slides: [{ image: 'https://via.placeholder.com/800x400', caption: 'Slide 1' }, { image: 'https://via.placeholder.com/800x400', caption: 'Slide 2' }] }, style: { width: '100%', position: 'relative' } },
    tabs: { type: 'tabs', tag: 'div', props: { tabs: [{ label: 'Tab 1', content: 'Content 1' }, { label: 'Tab 2', content: 'Content 2' }] }, style: { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    accordion: { type: 'accordion', tag: 'div', props: { items: [{ title: 'Item 1', content: 'Content 1' }, { title: 'Item 2', content: 'Content 2' }] }, style: { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' } },
    form: { type: 'form', tag: 'form', props: { title: 'Contact Us', submitText: 'Send Message' }, style: { padding: '32px', backgroundColor: '#f8fafc', borderRadius: '8px' } },
    video: { type: 'video', tag: 'div', props: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Video' }, style: { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' } },
    map: { type: 'map', tag: 'div', props: { address: 'New York, NY', zoom: '13' }, style: { height: '300px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    social: { type: 'social', tag: 'div', props: { platforms: ['twitter', 'facebook', 'instagram', 'linkedin'] }, style: { display: 'flex', gap: '16px', justifyContent: 'center', padding: '20px' } },
    testimonial: { type: 'testimonial', tag: 'div', props: { quote: 'Great product!', author: 'John Doe', role: 'CEO', avatar: 'https://via.placeholder.com/80' }, style: { padding: '32px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' } },
    pricing: { type: 'pricing', tag: 'div', props: { title: 'Basic', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], buttonText: 'Get Started', highlighted: false }, style: { padding: '32px', backgroundColor: '#ffffff', borderRadius: '8px', border: '2px solid #e2e8f0', textAlign: 'center' } },
    progress: { type: 'progress', tag: 'div', props: { label: 'Progress', value: 75, color: '#6366f1' }, style: { width: '100%' } },
    gallery: { type: 'gallery', tag: 'div', props: { images: [{ src: 'https://via.placeholder.com/300', alt: 'Image 1' }, { src: 'https://via.placeholder.com/300', alt: 'Image 2' }, { src: 'https://via.placeholder.com/300', alt: 'Image 3' }], columns: '3' }, style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } },
    videobg: { type: 'videobg', tag: 'div', props: { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', title: 'Video Background Title', subtitle: 'Your subtitle here' }, style: { position: 'relative', minHeight: '500px', overflow: 'hidden', borderRadius: '8px' } },
    contactform: { type: 'contactform', tag: 'form', props: { title: 'Get in Touch', nameLabel: 'Name', emailLabel: 'Email', messageLabel: 'Message', submitText: 'Send Message' }, style: { maxWidth: '600px', margin: '0 auto', padding: '32px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } },
    pricingtable: { type: 'pricingtable', tag: 'div', props: { plans: [{ name: 'Basic', price: '$9', period: '/month', features: ['1 User', '10GB Storage', 'Basic Support'], featured: false }, { name: 'Pro', price: '$29', period: '/month', features: ['5 Users', '100GB Storage', 'Priority Support', 'Analytics'], featured: true }, { name: 'Enterprise', price: '$99', period: '/month', features: ['Unlimited Users', '1TB Storage', '24/7 Support', 'Custom Solutions'], featured: false }] }, style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' } },
    faq: { type: 'faq', tag: 'div', props: { title: 'Frequently Asked Questions', items: [{ question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee.' }, { question: 'How do I contact support?', answer: 'Email us at support@example.com' }, { question: 'Do you offer international shipping?', answer: 'Yes, we ship to over 100 countries.' }] }, style: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' } },
    stats: { type: 'stats', tag: 'div', props: { statItems: [{ value: '10K+', label: 'Customers' }, { value: '99%', label: 'Satisfaction' }, { value: '24/7', label: 'Support' }, { value: '150+', label: 'Products' }] }, style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '32px', padding: '40px 0' } },
    socialembed: { type: 'socialembed', tag: 'div', props: { platforms: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'] }, style: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', padding: '20px' } },
    googlemap: { type: 'googlemap', tag: 'div', props: { address: '1600 Amphitheatre Parkway, Mountain View, CA', width: '100%', height: '400px' }, style: { width: '100%', height: '400px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' } },
    chart: { type: 'chart', tag: 'div', props: { chartType: 'bar', title: 'Sales Chart', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], data: [12, 19, 8, 15, 22] }, style: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } },
    team: { type: 'team', tag: 'div', props: { name: 'Team Member', role: 'Developer', bio: 'Passionate about building', image: 'https://via.placeholder.com/150', social: {} }, style: { padding: '24px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '8px' } },
    cta: { type: 'cta', tag: 'section', props: { title: 'Ready to Get Started?', subtitle: 'Join us today', buttonText: 'Get Started', buttonUrl: '#' }, style: { padding: '80px 40px', textAlign: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '8px' } },
    timeline: { type: 'timeline', tag: 'div', props: { items: [{ year: '2020', title: 'Started', description: 'Company founded' }] }, style: { position: 'relative', padding: '40px 0' } }
};

// ============================================
// PAGE TEMPLATES
// ============================================
const pageTemplates = {
    landing: [
        { type: 'navbar', props: { brand: 'Your Brand' } },
        { type: 'hero', props: { title: 'Welcome to Your Product', subtitle: 'The best solution for your needs' } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'Features', level: 'h2' } },
            { type: 'grid', children: [
                { type: 'card', children: [{ type: 'icon', props: { icon: 'rocket', size: '32px' } }, { type: 'heading', props: { content: 'Feature 1', level: 'h3' } }, { type: 'text', props: { content: 'Description of your amazing feature.' } }] },
                { type: 'card', children: [{ type: 'icon', props: { icon: 'shield-alt', size: '32px' } }, { type: 'heading', props: { content: 'Feature 2', level: 'h3' } }, { type: 'text', props: { content: 'Description of another great feature.' } }] },
                { type: 'card', children: [{ type: 'icon', props: { icon: 'bolt', size: '32px' } }, { type: 'heading', props: { content: 'Feature 3', level: 'h3' } }, { type: 'text', props: { content: 'Description of yet another feature.' } }] }
            ]}
        ]},
        { type: 'container', style: { textAlign: 'center', padding: '60px 20px' }, children: [
            { type: 'heading', props: { content: 'Ready to get started?' } },
            { type: 'button', props: { label: 'Sign Up Now' } }
        ]}
    ],
    portfolio: [
        { type: 'navbar', props: { brand: 'Portfolio' } },
        { type: 'hero', props: { title: 'Creative Designer', subtitle: 'I create beautiful digital experiences' } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'My Work', level: 'h2' } },
            { type: 'gallery', props: { images: [{ src: 'https://via.placeholder.com/400x300', alt: 'Project 1' }, { src: 'https://via.placeholder.com/400x300', alt: 'Project 2' }, { src: 'https://via.placeholder.com/400x300', alt: 'Project 3' }], columns: '3' } }
        ]},
        { type: 'container', style: { padding: '60px 20px' }, children: [
            { type: 'heading', props: { content: 'About Me', level: 'h2' } },
            { type: 'text', props: { content: 'I am a passionate designer with over 5 years of experience creating stunning digital experiences.' } }
        ]}
    ],
    blog: [
        { type: 'navbar', props: { brand: 'Blog' } },
        { type: 'container', style: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }, children: [
            { type: 'heading', props: { content: 'Blog Post Title', level: 'h1' } },
            { type: 'text', props: { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' } },
            { type: 'image', props: { src: 'https://via.placeholder.com/800x400' } },
            { type: 'text', props: { content: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.' } }
        ]}
    ],
    contact: [
        { type: 'navbar', props: { brand: 'Contact Us' } },
        { type: 'container', style: { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }, children: [
            { type: 'heading', props: { content: 'Get in Touch', level: 'h1' } },
            { type: 'text', props: { content: 'We would love to hear from you! Fill out the form below.' } },
            { type: 'contactform', props: { title: '' } }
        ]}
    ],
    saas: [
        { type: 'navbar', props: { brand: 'SaaS Product' } },
        { type: 'hero', props: { title: 'Scale Your Business', subtitle: 'The all-in-one platform' } },
        { type: 'stats', props: { statItems: [{ value: '10K+', label: 'Active Users' }, { value: '99.9%', label: 'Uptime' }, { value: '24/7', label: 'Support' }] } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'Pricing', level: 'h2', style: { textAlign: 'center' } } },
            { type: 'pricingtable', props: {} }
        ]}
    ],
    restaurant: [
        { type: 'navbar', props: { brand: 'Restaurant' } },
        { type: 'hero', props: { title: 'Fine Dining Experience', subtitle: 'Authentic cuisine' } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'Our Menu', level: 'h2' } },
            { type: 'grid', children: [
                { type: 'card', children: [{ type: 'heading', props: { content: 'Appetizers', level: 'h3' } }, { type: 'text', props: { content: 'Start your meal with our appetizers.' } }, { type: 'button', props: { label: 'View Menu' } }] },
                { type: 'card', children: [{ type: 'heading', props: { content: 'Main Course', level: 'h3' } }, { type: 'text', props: { content: 'Savor our chef special courses.' } }, { type: 'button', props: { label: 'View Menu' } }] },
                { type: 'card', children: [{ type: 'heading', props: { content: 'Desserts', level: 'h3' } }, { type: 'text', props: { content: 'End on a sweet note.' } }, { type: 'button', props: { label: 'View Menu' } }] }
            ]}
        ]}
    ],
    agency: [
        { type: 'navbar', props: { brand: 'Digital Agency' } },
        { type: 'hero', props: { title: 'We Build Brands', subtitle: 'Creative solutions' } },
        { type: 'stats', props: { statItems: [{ value: '150+', label: 'Projects' }, { value: '50+', label: 'Clients' }, { value: '10+', label: 'Awards' }] } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'Our Services', level: 'h2' } },
            { type: 'grid', children: [
                { type: 'card', children: [{ type: 'icon', props: { icon: 'paint-brush', size: '32px' } }, { type: 'heading', props: { content: 'Design', level: 'h3' } }, { type: 'text', props: { content: 'Beautiful designs.' } }] },
                { type: 'card', children: [{ type: 'icon', props: { icon: 'code', size: '32px' } }, { type: 'heading', props: { content: 'Development', level: 'h3' } }, { type: 'text', props: { content: 'Robust solutions.' } }] },
                { type: 'card', children: [{ type: 'icon', props: { icon: 'bullhorn', size: '32px' } }, { type: 'heading', props: { content: 'Marketing', level: 'h3' } }, { type: 'text', props: { content: 'Data-driven strategies.' } }] }
            ]}
        ]}
    ],
    startup: [
        { type: 'navbar', props: { brand: 'Startup' } },
        { type: 'hero', props: { title: 'Innovation Starts Here', subtitle: 'Join the next generation' } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'Why Choose Us?', level: 'h2' } },
            { type: 'grid', children: [
                { type: 'card', children: [{ type: 'badge', props: { text: 'Fast' } }, { type: 'text', props: { content: 'Lightning-fast performance.' } }] },
                { type: 'card', children: [{ type: 'badge', props: { text: 'Secure' } }, { type: 'text', props: { content: 'Enterprise-grade security.' } }] },
                { type: 'card', children: [{ type: 'badge', props: { text: 'Scalable' } }, { type: 'text', props: { content: 'Grow without limits.' } }] }
            ]}
        ]}
    ],
    corporate: [
        { type: 'navbar', props: { brand: 'Corporation' } },
        { type: 'hero', props: { title: 'Global Solutions', subtitle: 'Leading the industry' } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'About Us', level: 'h2' } },
            { type: 'text', props: { content: 'We are a leading provider of innovative solutions.' } },
            { type: 'divider' },
            { type: 'heading', props: { content: 'Our Team', level: 'h2' } },
            { type: 'grid', children: [
                { type: 'team', props: { name: 'Jane Smith', role: 'CEO', bio: 'Visionary leader.' } },
                { type: 'team', props: { name: 'John Doe', role: 'CTO', bio: 'Tech innovator.' } }
            ]}
        ]}
    ],
    ecommerce: [
        { type: 'navbar', props: { brand: 'Shop' } },
        { type: 'hero', props: { title: 'Summer Collection', subtitle: 'Discover the latest trends' } },
        { type: 'container', children: [
            { type: 'heading', props: { content: 'Featured Products', level: 'h2' } },
            { type: 'grid', children: [
                { type: 'card', children: [{ type: 'image', props: { src: 'https://via.placeholder.com/300x300' } }, { type: 'heading', props: { content: 'Product 1', level: 'h4' } }, { type: 'text', props: { content: '$49.99' } }, { type: 'button', props: { label: 'Add to Cart' } }] },
                { type: 'card', children: [{ type: 'image', props: { src: 'https://via.placeholder.com/300x300' } }, { type: 'heading', props: { content: 'Product 2', level: 'h4' } }, { type: 'text', props: { content: '$59.99' } }, { type: 'button', props: { label: 'Add to Cart' } }] },
                { type: 'card', children: [{ type: 'image', props: { src: 'https://via.placeholder.com/300x300' } }, { type: 'heading', props: { content: 'Product 3', level: 'h4' } }, { type: 'text', props: { content: '$39.99' } }, { type: 'button', props: { label: 'Add to Cart' } }] }
            ]}
        ]}
    ]
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initDeviceToggle();
    initButtons();
    initTabs();
    initTemplates();
    initKeyboardShortcuts();
    initContextMenu();
    initComponentSearch();
    initAutoSave();
    loadFromLocalStorage();
    saveState();
    showToast('Editor ready! Start building your website.', 'success');
});


// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode', state.darkMode);
    
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = state.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    showToast(state.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
}

// ============================================
// NEW PROJECT
// ============================================
function newProject() {
    if (state.isDirty) {
        if (!confirm('You have unsaved changes. Are you sure you want to create a new project?')) {
            return;
        }
    }
    
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-plus-circle"></i>
            <p>Drag components here to start building</p>
            <small>Try dragging a Hero or Container from the sidebar</small>
            <div class="quick-start">
                <button class="btn btn-primary" onclick="loadTemplate('landing')">
                    <i class="fas fa-rocket"></i> Start with a Template
                </button>
            </div>
        </div>
    `;
    
    state.currentProject = null;
    state.currentProjectId = null;
    state.componentCounter = 0;
    state.selectedComponents.clear();
    state.lastSelected = null;
    state.history = [];
    state.historyIndex = -1;
    state.isDirty = false;
    
    updatePropertiesPanel();
    updateComponentTree();
    saveState();
    
    showToast('New project created', 'success');
}

// ============================================
// BUTTON INITIALIZATION
// ============================================
function initButtons() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    const newProjectBtn = document.getElementById('new-project');
    if (newProjectBtn) newProjectBtn.addEventListener('click', newProject);
    
    const saveProjectBtn = document.getElementById('save-project');
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProject);
    
    const exportProjectBtn = document.getElementById('export-project');
    if (exportProjectBtn) exportProjectBtn.addEventListener('click', exportProject);
    
    const previewModeBtn = document.getElementById('preview-mode');
    if (previewModeBtn) previewModeBtn.addEventListener('click', togglePreview);
    
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) helpBtn.addEventListener('click', showHelpModal);
}

// ============================================
// DRAG AND DROP
// ============================================
function initDragAndDrop() {
    const componentItems = document.querySelectorAll('.component-item');
    const canvas = document.getElementById('canvas');

    componentItems.forEach(item => {
        item.addEventListener('dragstart', handleSidebarDragStart);
        item.addEventListener('dragend', handleSidebarDragEnd);
    });

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleCanvasDrop);
}

function handleSidebarDragStart(e) {
    e.dataTransfer.setData('source', 'sidebar');
    e.dataTransfer.setData('component-type', e.target.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
    state.dragSource = 'sidebar';
    e.target.classList.add('dragging');
}

function handleSidebarDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleComponentDragStart(e) {
    e.dataTransfer.setData('source', 'canvas');
    e.dataTransfer.setData('component-id', e.target.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    state.dragSource = 'canvas';
    state.draggedElement = e.target;
    e.target.style.opacity = '0.5';
}

function handleComponentDragEnd(e) {
    e.target.style.opacity = '1';
    state.draggedElement = null;
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = state.dragSource === 'canvas' ? 'move' : 'copy';
    
    const canvas = document.getElementById('canvas');
    const target = e.target.closest('.canvas-component');
    
    if (!target || target === canvas) {
        canvas.classList.add('drag-over');
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        return;
    }
    
    if (target && state.dragSource === 'canvas') {
        const type = target.dataset.type;
        const template = componentTemplates[type];
        
        if (template && template.canNest) {
            document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            target.classList.add('drop-target');
        }
    }
}

function handleDragLeave(e) {
    const canvas = document.getElementById('canvas');
    if (!e.relatedTarget || !e.relatedTarget.closest('#canvas')) {
        canvas.classList.remove('drag-over');
    }
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
}

function handleCanvasDrop(e) {
    e.preventDefault();
    const canvas = document.getElementById('canvas');
    canvas.classList.remove('drag-over');
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    
    const source = e.dataTransfer.getData('source');
    
    if (source === 'sidebar') {
        handleNewComponentDrop(e);
    } else if (source === 'canvas' && state.draggedElement) {
        handleMoveComponentDrop(e);
    }
}

function handleNewComponentDrop(e) {
    const componentType = e.dataTransfer.getData('component-type');
    if (!componentType || !componentTemplates[componentType]) {
        showToast('Invalid component type', 'error');
        return;
    }
    
    const canvas = document.getElementById('canvas');
    const emptyState = canvas.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    const dropTarget = e.target.closest('.canvas-component');
    let parent = canvas;
    
    if (dropTarget) {
        const type = dropTarget.dataset.type;
        const template = componentTemplates[type];
        
        if (template && template.canNest) {
            const innerEl = dropTarget.querySelector(`.wysiwyg-${type}`);
            if (innerEl) parent = innerEl;
        }
    }
    
    const component = createComponent(componentType);
    
    if (dropTarget && dropTarget.dataset.type === 'grid') {
        component.style.width = '100%';
    }
    
    parent.appendChild(component);
    selectComponent(component);
    saveState();
    markDirty();
    showToast(capitalize(componentType) + ' added', 'success');
}

function handleMoveComponentDrop(e) {
    const dropTarget = e.target.closest('.canvas-component');
    const compId = e.dataTransfer.getData('component-id');
    const component = document.querySelector(`[data-id="${compId}"]`);
    
    if (!component || component === dropTarget) return;
    
    if (dropTarget && (dropTarget === component || dropTarget.contains(component))) {
        showToast('Cannot move component into itself', 'error');
        return;
    }
    
    let parent;
    if (dropTarget) {
        const type = dropTarget.dataset.type;
        const template = componentTemplates[type];
        
        if (template && template.canNest) {
            const innerEl = dropTarget.querySelector(`.wysiwyg-${type}`);
            if (innerEl) {
                parent = innerEl;
            } else {
                parent = document.getElementById('canvas');
            }
        } else {
            const rect = dropTarget.getBoundingClientRect();
            const isTop = e.clientY < rect.top + rect.height / 2;
            
            if (isTop) {
                dropTarget.parentNode.insertBefore(component, dropTarget);
            } else {
                dropTarget.parentNode.insertBefore(component, dropTarget.nextSibling);
            }
            saveState();
            markDirty();
            showToast('Component moved', 'success');
            return;
        }
    } else {
        parent = document.getElementById('canvas');
    }
    
    parent.appendChild(component);
    saveState();
    markDirty();
    showToast('Component moved', 'success');
}


// ============================================
// COMPONENT CREATION
// ============================================
function createComponent(type, data) {
    const template = data || JSON.parse(JSON.stringify(componentTemplates[type]));
    const id = 'comp-' + (++state.componentCounter);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-component';
    wrapper.dataset.id = id;
    wrapper.dataset.type = type;
    wrapper.draggable = true;
    
    wrapper.addEventListener('dragstart', handleComponentDragStart);
    wrapper.addEventListener('dragend', handleComponentDragEnd);
    
    const actions = document.createElement('div');
    actions.className = 'component-actions';
    actions.innerHTML = `
        <button onclick="moveComponentUp('${id}')" title="Move Up"><i class="fas fa-arrow-up"></i></button>
        <button onclick="moveComponentDown('${id}')" title="Move Down"><i class="fas fa-arrow-down"></i></button>
        <button onclick="duplicateComponent('${id}')" title="Duplicate"><i class="fas fa-copy"></i></button>
        <button onclick="deleteComponent('${id}')" title="Delete" class="delete"><i class="fas fa-trash"></i></button>
    `;
    wrapper.appendChild(actions);
    
    const element = document.createElement(template.tag);
    element.className = 'wysiwyg-' + type;
    Object.assign(element.style, template.style);
    
    renderComponentContent(element, type, template);
    
    wrapper.appendChild(element);
    
    if (template.children && template.children.length > 0) {
        template.children.forEach(child => {
            const childEl = createComponent(child.type, child);
            element.appendChild(childEl);
        });
    }
    
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.isShiftPressed) {
            toggleMultiSelect(wrapper);
        } else {
            selectComponent(wrapper);
        }
    });
    
    return wrapper;
}

function renderComponentContent(element, type, template) {
    switch (type) {
        case 'text':
            element.textContent = template.props.content;
            element.contentEditable = !state.isPreviewMode;
            if (!state.isPreviewMode) {
                element.addEventListener('blur', () => {
                    updateComponentProp(element.parentElement.dataset.id, 'content', element.textContent);
                    saveState();
                    markDirty();
                });
            }
            break;
            
        case 'heading':
            element.textContent = template.props.content;
            element.contentEditable = !state.isPreviewMode;
            if (!state.isPreviewMode) {
                element.addEventListener('blur', () => {
                    updateComponentProp(element.parentElement.dataset.id, 'content', element.textContent);
                    saveState();
                    markDirty();
                });
            }
            break;
            
        case 'button':
            element.textContent = template.props.label;
            element.href = template.props.url || '#';
            element.addEventListener('click', (e) => {
                if (!state.isPreviewMode) e.preventDefault();
            });
            break;
            
        case 'image':
            element.src = template.props.src;
            element.alt = template.props.alt;
            break;
            
        case 'hero':
            element.innerHTML = '<h1 style="font-size: 48px; margin-bottom: 16px; font-weight: 700;">' + template.props.title + '</h1><p style="font-size: 20px; opacity: 0.9;">' + template.props.subtitle + '</p>';
            break;
            
        case 'navbar':
            const navLinks = template.props.links || [{ label: 'Home', url: '#home' }, { label: 'About', url: '#about' }];
            const linksHtml = navLinks.map(link => '<a href="' + link.url + '" style="color: white; text-decoration: none; margin-left: 24px;">' + link.label + '</a>').join('');
            element.innerHTML = '<span style="font-weight: 700; font-size: 1.25rem;">' + template.props.brand + '</span><div>' + linksHtml + '</div>';
            break;
            
        case 'footer':
            element.innerHTML = '<div style="text-align: center;"><h3 style="margin-bottom: 8px;">' + template.props.brand + '</h3><p style="opacity: 0.8; margin-bottom: 16px;">' + template.props.tagline + '</p><p style="font-size: 0.875rem; opacity: 0.6;">&copy; ' + template.props.copyright + '</p></div>';
            break;
            
        case 'icon':
            element.innerHTML = '<i class="fas fa-' + template.props.icon + '" style="font-size: ' + template.props.size + '; color: ' + template.props.color + ';"></i>';
            break;
            
        case 'badge':
            element.textContent = template.props.text;
            break;
            
        case 'card':
            element.innerHTML = '<div class="card-content" style="min-height: 50px;"></div>';
            break;
            
        case 'container':
            element.innerHTML = '<div class="container-content" style="min-height: 50px;"></div>';
            break;
            
        case 'grid':
            element.innerHTML = '<div class="grid-content" style="min-height: 50px;"></div>';
            break;
            
        case 'spacer':
            element.style.height = template.props.height;
            break;
            
        case 'video':
            element.innerHTML = '<iframe src="' + template.props.url + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>';
            break;
            
        case 'map':
            element.innerHTML = '<div style="text-align: center;"><i class="fas fa-map-marked-alt" style="font-size: 48px; color: #94a3b8; margin-bottom: 12px;"></i><p style="color: #64748b;">' + template.props.address + '</p></div>';
            break;
            
        case 'social':
            const platforms = template.props.platforms || ['twitter', 'facebook'];
            const icons = { twitter: 'fa-twitter', facebook: 'fa-facebook-f', instagram: 'fa-instagram', linkedin: 'fa-linkedin-in', youtube: 'fa-youtube', github: 'fa-github' };
            element.innerHTML = platforms.map(p => '<a href="#" style="width: 40px; height: 40px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; text-decoration: none;"><i class="fab ' + (icons[p] || 'fa-share') + '"></i></a>').join('');
            break;
            
        case 'testimonial':
            element.innerHTML = '<div class="quote" style="font-size: 1.25rem; font-style: italic; margin-bottom: 20px;">"' + template.props.quote + '"</div><div class="author" style="display: flex; align-items: center; justify-content: center; gap: 12px;"><img src="' + template.props.avatar + '" style="width: 60px; height: 60px; border-radius: 50%;" alt=""><div style="text-align: left;"><div style="font-weight: 600;">' + template.props.author + '</div><div style="font-size: 0.875rem; color: #64748b;">' + template.props.role + '</div></div></div>';
            break;
            
        case 'pricing':
            const features = template.props.features || [];
            const featuresHtml = features.map(f => '<li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><i class="fas fa-check" style="color: #22c55e; margin-right: 8px;"></i>' + f + '</li>').join('');
            element.innerHTML = '<div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 8px;">' + template.props.title + '</div><div style="font-size: 3rem; font-weight: 700; color: #6366f1; margin-bottom: 4px;">' + template.props.price + '</div><div style="color: #64748b; margin-bottom: 24px;">' + template.props.period + '</div><ul style="list-style: none; padding: 0; margin: 0 0 24px;">' + featuresHtml + '</ul><a href="#" class="wysiwyg-button">' + template.props.buttonText + '</a>';
            break;
            
        case 'progress':
            element.innerHTML = '<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.875rem;"><span>' + template.props.label + '</span><span>' + template.props.value + '%</span></div><div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;"><div style="width: ' + template.props.value + '%; height: 100%; background: ' + template.props.color + '; border-radius: 4px;"></div></div>';
            break;
            
        case 'gallery':
            const images = template.props.images || [];
            element.innerHTML = images.map(img => '<img src="' + img.src + '" alt="' + (img.alt || '') + '" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">').join('');
            break;
            
        case 'stats':
            const statItems = template.props.statItems || [];
            element.innerHTML = statItems.map(stat => '<div style="text-align: center;"><div style="font-size: 3rem; font-weight: 700; color: #6366f1; line-height: 1; margin-bottom: 8px;">' + stat.value + '</div><div style="color: #64748b; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">' + stat.label + '</div></div>').join('');
            break;
            
        case 'team':
            element.innerHTML = '<img src="' + template.props.image + '" alt="' + template.props.name + '" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 16px; object-fit: cover;"><h3 style="margin-bottom: 4px;">' + template.props.name + '</h3><p style="color: #6366f1; margin-bottom: 8px;">' + template.props.role + '</p><p style="color: #64748b; font-size: 0.875rem;">' + template.props.bio + '</p>';
            break;
            
        case 'cta':
            element.innerHTML = '<h2 style="font-size: 2.5rem; margin-bottom: 16px;">' + template.props.title + '</h2><p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 32px;">' + template.props.subtitle + '</p><a href="' + template.props.buttonUrl + '" class="wysiwyg-button" style="font-size: 1.125rem; padding: 16px 32px;">' + template.props.buttonText + '</a>';
            break;
            
        case 'timeline':
            const timelineItems = template.props.items || [];
            element.innerHTML = '<div style="position: relative; padding: 20px 0;"><div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: #6366f1; transform: translateX(-50%);"></div>' + timelineItems.map((item, i) => '<div style="display: flex; justify-content: ' + (i % 2 === 0 ? 'flex-end' : 'flex-start') + '; padding-' + (i % 2 === 0 ? 'right' : 'left') + ': 50%; position: relative; margin-bottom: 32px;"><div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; margin-' + (i % 2 === 0 ? 'right' : 'left') + ': 24px;"><div style="display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 8px;">' + item.year + '</div><h4 style="margin: 0 0 8px;">' + item.title + '</h4><p style="margin: 0; color: #64748b;">' + item.description + '</p></div></div>').join('') + '</div>';
            break;
            
        case 'form':
            element.innerHTML = '<h3 style="margin-bottom: 20px;">' + template.props.title + '</h3><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 6px; font-weight: 500;">Name</label><input type="text" placeholder="Your name" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;"></div><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 6px; font-weight: 500;">Email</label><input type="email" placeholder="your@email.com" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;"></div><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 6px; font-weight: 500;">Message</label><textarea placeholder="Your message..." rows="4" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; resize: vertical;"></textarea></div><button type="submit" class="wysiwyg-button">' + template.props.submitText + '</button>';
            break;
            
        case 'carousel':
            const slides = template.props.slides || [];
            element.innerHTML = '<div style="position: relative;">' + slides.map((slide, i) => '<div style="display: ' + (i === 0 ? 'block' : 'none') + ';"><img src="' + slide.image + '" style="width: 100%; height: auto; border-radius: 8px;" alt=""><div style="position: absolute; bottom: 20px; left: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 12px 16px; border-radius: 6px;">' + slide.caption + '</div></div>').join('') + '</div>';
            break;
            
        case 'tabs':
            const tabs = template.props.tabs || [];
            element.innerHTML = '<div style="display: flex; border-bottom: 2px solid #e2e8f0;">' + tabs.map((tab, i) => '<div style="padding: 12px 20px; cursor: pointer; ' + (i === 0 ? 'color: #6366f1; border-bottom: 2px solid #6366f1;' : '') + '">' + tab.label + '</div>').join('') + '</div>' + tabs.map((tab, i) => '<div style="padding: 20px; display: ' + (i === 0 ? 'block' : 'none') + ';">' + tab.content + '</div>').join('');
            break;
            
        case 'accordion':
            const accItems = template.props.items || [];
            element.innerHTML = accItems.map((item, i) => '<div style="border-bottom: 1px solid #e2e8f0;"><div style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 500;">' + item.title + '<i class="fas fa-chevron-down"></i></div><div style="padding: 0 20px 16px; display: ' + (i === 0 ? 'block' : 'none') + ';">' + item.content + '</div></div>').join('');
            break;
            
        case 'faq':
            const faqItems = template.props.items || [];
            element.innerHTML = (template.props.title ? '<h2 style="text-align: center; margin-bottom: 40px; font-size: 2rem;">' + template.props.title + '</h2>' : '') + '<div>' + faqItems.map((item, i) => '<div style="border-bottom: 1px solid #e2e8f0;"><button style="width: 100%; padding: 20px 0; background: none; border: none; text-align: left; font-size: 1.125rem; font-weight: 500; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">' + item.question + '<i class="fas fa-chevron-down"></i></button><div style="padding-bottom: 20px; display: ' + (i === 0 ? 'block' : 'none') + ';"><p style="color: #64748b; line-height: 1.6;">' + item.answer + '</p></div></div>').join('') + '</div>';
            break;
            
        case 'pricingtable':
            const plans = template.props.plans || [];
            element.innerHTML = plans.map(plan => '<div style="background: white; border-radius: 12px; padding: 32px; text-align: center; border: 2px solid ' + (plan.featured ? '#6366f1' : '#e2e8f0') + '; ' + (plan.featured ? 'transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);' : '') + '"><h3 style="margin-bottom: 16px; font-size: 1.25rem;">' + plan.name + '</h3><div style="font-size: 3rem; font-weight: 700; color: #6366f1; margin: 16px 0;">' + plan.price + '</div><div style="color: #64748b; margin-bottom: 24px;">' + plan.period + '</div><ul style="list-style: none; padding: 0; margin: 0 0 24px;">' + plan.features.map(f => '<li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><i class="fas fa-check" style="color: #22c55e; margin-right: 8px;"></i>' + f + '</li>').join('') + '</ul><button class="wysiwyg-button" style="width: 100%;">Get Started</button></div>').join('');
            break;
            
        case 'contactform':
            element.innerHTML = (template.props.title ? '<h3 style="margin-bottom: 24px; font-size: 1.5rem; text-align: center;">' + template.props.title + '</h3>' : '') + '<div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">' + (template.props.nameLabel || 'Name') + '</label><input type="text" name="name" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem;" placeholder="Enter your name"></div><div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">' + (template.props.emailLabel || 'Email') + '</label><input type="email" name="email" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem;" placeholder="Enter your email"></div><div style="margin-bottom: 24px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">' + (template.props.messageLabel || 'Message') + '</label><textarea name="message" rows="4" required style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; resize: vertical;" placeholder="Enter your message"></textarea></div><button type="submit" class="wysiwyg-button" style="width: 100%;">' + template.props.submitText + '</button>';
            break;
            
        case 'videobg':
            element.innerHTML = '<video autoplay muted loop playsinline style="position: absolute; top: 50%; left: 50%; min-width: 100%; min-height: 100%; transform: translate(-50%, -50%); object-fit: cover;"><source src="' + template.props.videoUrl + '" type="video/mp4"></video><div style="position: relative; z-index: 1; padding: 80px 40px; text-align: center; color: white; background: rgba(0,0,0,0.4);"><h2 style="font-size: 48px; margin-bottom: 16px; font-weight: 700;">' + template.props.title + '</h2><p style="font-size: 20px; opacity: 0.9;">' + template.props.subtitle + '</p></div>';
            break;
            
        case 'googlemap':
            element.innerHTML = '<i class="fas fa-map-marked-alt" style="font-size: 3rem; color: #94a3b8;"></i><p style="color: #64748b; text-align: center;">' + template.props.address + '</p><small style="color: #94a3b8;">Map placeholder</small>';
            break;
            
        case 'chart':
            element.innerHTML = '<h4 style="margin-bottom: 16px; font-size: 1.125rem;">' + template.props.title + '</h4><div style="height: 200px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b;">Chart: ' + template.props.chartType + '</div>';
            break;
            
        case 'socialembed':
            const socialPlatforms = template.props.platforms || [];
            const socialColors = { facebook: '#1877f2', twitter: '#1da1f2', instagram: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743)', linkedin: '#0077b5', youtube: '#ff0000' };
            element.innerHTML = socialPlatforms.map(p => '<a href="#" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; background: ' + (socialColors[p] || '#6366f1') + '; text-decoration: none;"><i class="fab fa-' + p + '"></i></a>').join('');
            break;
    }
}


// ============================================
// COMPONENT SELECTION
// ============================================
function selectComponent(component) {
    document.querySelectorAll('.canvas-component.selected').forEach(el => el.classList.remove('selected'));
    state.selectedComponents.clear();
    
    component.classList.add('selected');
    state.selectedComponents.add(component.dataset.id);
    state.lastSelected = component;
    
    updatePropertiesPanel();
    updateComponentTree();
}

function toggleMultiSelect(component) {
    if (state.selectedComponents.has(component.dataset.id)) {
        component.classList.remove('selected');
        state.selectedComponents.delete(component.dataset.id);
    } else {
        component.classList.add('selected');
        state.selectedComponents.add(component.dataset.id);
        state.lastSelected = component;
    }
    updatePropertiesPanel();
}

// ============================================
// COMPONENT ACTIONS
// ============================================
function moveComponentUp(id) {
    const component = document.querySelector(`[data-id="${id}"]`);
    if (!component || !component.previousElementSibling) return;
    
    component.parentNode.insertBefore(component, component.previousElementSibling);
    saveState();
    markDirty();
}

function moveComponentDown(id) {
    const component = document.querySelector(`[data-id="${id}"]`);
    if (!component || !component.nextElementSibling) return;
    
    component.parentNode.insertBefore(component.nextElementSibling, component);
    saveState();
    markDirty();
}

function duplicateComponent(id) {
    const component = document.querySelector(`[data-id="${id}"]`);
    if (!component) return;
    
    const clone = component.cloneNode(true);
    const newId = 'comp-' + (++state.componentCounter);
    clone.dataset.id = newId;
    
    clone.querySelectorAll('.component-actions button').forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            btn.setAttribute('onclick', onclick.replace(id, newId));
        }
    });
    
    clone.addEventListener('dragstart', handleComponentDragStart);
    clone.addEventListener('dragend', handleComponentDragEnd);
    clone.addEventListener('click', (e) => {
        e.stopPropagation();
        selectComponent(clone);
    });
    
    component.parentNode.insertBefore(clone, component.nextSibling);
    selectComponent(clone);
    saveState();
    markDirty();
    showToast('Component duplicated', 'success');
}

function deleteComponent(id) {
    const component = document.querySelector(`[data-id="${id}"]`);
    if (!component) return;
    
    component.remove();
    state.selectedComponents.delete(id);
    updatePropertiesPanel();
    updateComponentTree();
    saveState();
    markDirty();
    showToast('Component deleted', 'success');
}

// ============================================
// SAVE PROJECT
// ============================================
function saveProject() {
    const canvas = document.getElementById('canvas');
    const components = [];
    
    canvas.querySelectorAll(':scope > .canvas-component').forEach(comp => {
        components.push(serializeComponent(comp));
    });
    
    const projectData = {
        name: state.currentProject || 'Untitled Project',
        components: components,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('wysiwyg_current_project', JSON.stringify(projectData));
    
    fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    })
    .then(response => response.json())
    .then(data => {
        state.currentProjectId = data.id;
        state.isDirty = false;
        showToast('Project saved successfully', 'success');
    })
    .catch(error => {
        console.error('Save error:', error);
        showToast('Saved locally (server unavailable)', 'warning');
    });
}

function serializeComponent(element) {
    const type = element.dataset.type;
    const template = componentTemplates[type];
    const innerEl = element.querySelector(`.wysiwyg-${type}`);
    
    const data = {
        type: type,
        props: {},
        style: {},
        children: []
    };
    
    if (innerEl) {
        const childComponents = innerEl.querySelectorAll(':scope > .canvas-component');
        childComponents.forEach(child => {
            data.children.push(serializeComponent(child));
        });
    }
    
    return data;
}

// ============================================
// EXPORT PROJECT
// ============================================
function exportProject() {
    const canvas = document.getElementById('canvas');
    const components = canvas.querySelectorAll(':scope > .canvas-component');
    
    if (components.length === 0) {
        showToast('Nothing to export', 'error');
        return;
    }
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Website</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
        img { max-width: 100%; height: auto; }
        a { text-decoration: none; }
        .wysiwyg-button { display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; font-size: 16px; cursor: pointer; border: none; }
        .wysiwyg-button:hover { background: #4f46e5; }
    </style>
</head>
<body>
`;
    
    components.forEach(comp => {
        html += exportComponent(comp);
    });
    
    html += `
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Website exported successfully', 'success');
}

function exportComponent(element) {
    const type = element.dataset.type;
    const innerEl = element.querySelector(`.wysiwyg-${type}`);
    
    if (!innerEl) return '';
    
    const clone = innerEl.cloneNode(true);
    clone.className = clone.className.replace('wysiwyg-', 'exported-');
    
    clone.querySelectorAll('.canvas-component').forEach(child => {
        const childType = child.dataset.type;
        const childInner = child.querySelector(`.wysiwyg-${childType}`);
        if (childInner) {
            const childClone = childInner.cloneNode(true);
            childClone.className = childClone.className.replace('wysiwyg-', 'exported-');
            child.replaceWith(childClone);
        }
    });
    
    return clone.outerHTML + '\\n';
}

// ============================================
// PREVIEW MODE
// ============================================
function togglePreview() {
    state.isPreviewMode = !state.isPreviewMode;
    document.body.classList.toggle('preview-mode', state.isPreviewMode);
    
    const btn = document.getElementById('preview-mode');
    if (btn) {
        btn.innerHTML = state.isPreviewMode ? '<i class="fas fa-edit"></i> Edit' : '<i class="fas fa-eye"></i> Preview';
    }
    
    document.querySelectorAll('.canvas-component').forEach(comp => {
        const type = comp.dataset.type;
        const innerEl = comp.querySelector(`.wysiwyg-${type}`);
        if (innerEl) {
            if (type === 'text' || type === 'heading') {
                innerEl.contentEditable = !state.isPreviewMode;
            }
        }
    });
    
    showToast(state.isPreviewMode ? 'Preview mode enabled' : 'Edit mode enabled', 'success');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') state.isShiftPressed = true;
        if (e.key === 'Control' || e.key === 'Meta') state.isCtrlPressed = true;
        
        if (state.isCtrlPressed) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (state.isShiftPressed) redo();
                    else undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 's':
                    e.preventDefault();
                    saveProject();
                    break;
                case 'd':
                    e.preventDefault();
                    if (state.lastSelected) duplicateComponent(state.lastSelected.dataset.id);
                    break;
            }
        }
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.lastSelected && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.isContentEditable) {
                e.preventDefault();
                deleteComponent(state.lastSelected.dataset.id);
            }
        }
        
        if (e.key === 'Escape') {
            if (state.isPreviewMode) {
                togglePreview();
            } else {
                document.querySelectorAll('.canvas-component.selected').forEach(el => el.classList.remove('selected'));
                state.selectedComponents.clear();
                updatePropertiesPanel();
            }
        }
        
        if (e.key === '?') {
            showHelpModal();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') state.isShiftPressed = false;
        if (e.key === 'Control' || e.key === 'Meta') state.isCtrlPressed = false;
    });
}


// ============================================
// HISTORY / UNDO REDO
// ============================================
function saveState() {
    const canvas = document.getElementById('canvas');
    const stateData = canvas.innerHTML;
    
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    
    state.history.push(stateData);
    
    if (state.history.length > MAX_HISTORY) {
        state.history.shift();
    } else {
        state.historyIndex++;
    }
}

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreState();
        showToast('Undo', 'success');
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreState();
        showToast('Redo', 'success');
    }
}

function restoreState() {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = state.history[state.historyIndex];
    
    canvas.querySelectorAll('.canvas-component').forEach(comp => {
        comp.addEventListener('dragstart', handleComponentDragStart);
        comp.addEventListener('dragend', handleComponentDragEnd);
        comp.addEventListener('click', (e) => {
            e.stopPropagation();
            selectComponent(comp);
        });
    });
    
    updateComponentTree();
}

// ============================================
// TEMPLATES
// ============================================
function initTemplates() {
    document.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', () => {
            const templateName = item.dataset.template;
            loadTemplate(templateName);
        });
    });
}

function loadTemplate(templateName) {
    if (state.isDirty) {
        if (!confirm('You have unsaved changes. Load template anyway?')) {
            return;
        }
    }
    
    const template = pageTemplates[templateName];
    if (!template) {
        showToast('Template not found', 'error');
        return;
    }
    
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = '';
    state.componentCounter = 0;
    
    template.forEach(compData => {
        const comp = createComponent(compData.type, compData);
        canvas.appendChild(comp);
    });
    
    saveState();
    markDirty();
    updateComponentTree();
    showToast('Template loaded: ' + capitalize(templateName), 'success');
}

// ============================================
// DEVICE TOGGLE
// ============================================
function initDeviceToggle() {
    document.querySelectorAll('.device-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const device = btn.dataset.device;
            const canvas = document.getElementById('canvas');
            
            canvas.style.width = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%';
        });
    });
}

// ============================================
// TABS
// ============================================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById('tab-' + tabId).classList.add('active');
        });
    });
}

// ============================================
// COMPONENT TREE
// ============================================
function updateComponentTree() {
    const treeEl = document.getElementById('component-tree');
    const canvas = document.getElementById('canvas');
    const components = canvas.querySelectorAll(':scope > .canvas-component');
    
    if (components.length === 0) {
        treeEl.innerHTML = '<div class="empty-tree"><i class="fas fa-tree"></i><p>No components yet</p><small>Drag components from the Components tab to get started</small></div>';
        return;
    }
    
    let html = '<ul class="tree-list">';
    components.forEach(comp => {
        html += buildTreeItem(comp);
    });
    html += '</ul>';
    
    treeEl.innerHTML = html;
    
    treeEl.querySelectorAll('.tree-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = item.dataset.id;
            const comp = document.querySelector(`[data-id="${id}"]`);
            if (comp) selectComponent(comp);
        });
    });
}

function buildTreeItem(element) {
    const id = element.dataset.id;
    const type = element.dataset.type;
    const isSelected = state.selectedComponents.has(id);
    
    let html = '<li class="tree-item ' + (isSelected ? 'selected' : '') + '" data-id="' + id + '"><i class="fas fa-cube"></i> ' + capitalize(type) + '</li>';
    
    const innerEl = element.querySelector(`.wysiwyg-${type}`);
    if (innerEl) {
        const children = innerEl.querySelectorAll(':scope > .canvas-component');
        if (children.length > 0) {
            html += '<ul>';
            children.forEach(child => {
                html += buildTreeItem(child);
            });
            html += '</ul>';
        }
    }
    
    return html;
}

// ============================================
// PROPERTIES PANEL
// ============================================
function updatePropertiesPanel() {
    const panel = document.getElementById('properties-panel');
    
    if (state.selectedComponents.size === 0) {
        panel.innerHTML = '<div class="empty-properties"><i class="fas fa-mouse-pointer"></i><p>Select a component to edit its properties</p><small>Click any component on the canvas to customize it</small></div>';
        return;
    }
    
    const id = Array.from(state.selectedComponents)[0];
    const component = document.querySelector(`[data-id="${id}"]`);
    if (!component) return;
    
    const type = component.dataset.type;
    const template = componentTemplates[type];
    
    let html = '<div class="properties-section"><h4>' + capitalize(type) + ' Properties</h4>';
    
    if (template.props) {
        Object.keys(template.props).forEach(prop => {
            if (prop === 'content' || prop === 'label' || prop === 'text' || prop === 'title' || prop === 'subtitle') {
                html += '<div class="property-group"><label>' + capitalize(prop) + '</label><input type="text" value="' + (template.props[prop] || '') + '" onchange="updateComponentProp(\'' + id + '\', \'' + prop + '\', this.value)"></div>';
            }
            if (prop === 'url' || prop === 'href') {
                html += '<div class="property-group"><label>URL</label><input type="text" value="' + (template.props[prop] || '') + '" onchange="updateComponentProp(\'' + id + '\', \'' + prop + '\', this.value)"></div>';
            }
            if (prop === 'src') {
                html += '<div class="property-group"><label>Image URL</label><input type="text" value="' + (template.props[prop] || '') + '" onchange="updateComponentProp(\'' + id + '\', \'' + prop + '\', this.value)"></div>';
            }
        });
    }
    
    html += '</div>';
    panel.innerHTML = html;
}

function updateComponentProp(id, prop, value) {
    const component = document.querySelector(`[data-id="${id}"]`);
    if (!component) return;
    
    const type = component.dataset.type;
    const innerEl = component.querySelector(`.wysiwyg-${type}`);
    if (!innerEl) return;
    
    if (prop === 'content' && (type === 'text' || type === 'heading')) {
        innerEl.textContent = value;
    }
    if (prop === 'label' && type === 'button') {
        innerEl.textContent = value;
    }
    if (prop === 'src' && type === 'image') {
        innerEl.src = value;
    }
    
    saveState();
    markDirty();
}

// ============================================
// COMPONENT SEARCH
// ============================================
function initComponentSearch() {
    const searchInput = document.getElementById('component-search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.component-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'flex' : 'none';
        });
    });
}

// ============================================
// CONTEXT MENU
// ============================================
function initContextMenu() {
    // Context menu handled inline in component creation
}

function showContextMenu(e, component) {
    e.preventDefault();
    // Context menu implementation
}

// ============================================
// AUTO SAVE
// ============================================
function initAutoSave() {
    if (state.autoSaveInterval) clearInterval(state.autoSaveInterval);
    state.autoSaveInterval = setInterval(() => {
        if (state.isDirty) {
            saveToLocalStorage();
        }
    }, AUTO_SAVE_DELAY);
}

function markDirty() {
    state.isDirty = true;
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveToLocalStorage() {
    const canvas = document.getElementById('canvas');
    const data = {
        html: canvas.innerHTML,
        counter: state.componentCounter,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('wysiwyg_autosave', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('wysiwyg_autosave');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.html && data.html.trim() !== '') {
                const canvas = document.getElementById('canvas');
                canvas.innerHTML = data.html;
                state.componentCounter = data.counter || 0;
                
                canvas.querySelectorAll('.canvas-component').forEach(comp => {
                    comp.addEventListener('dragstart', handleComponentDragStart);
                    comp.addEventListener('dragend', handleComponentDragEnd);
                    comp.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectComponent(comp);
                    });
                });
            }
        } catch (e) {
            console.error('Failed to load autosave:', e);
        }
    }
}

// ============================================
// HELP MODAL
// ============================================
function showHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) modal.style.display = 'flex';
}

function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

