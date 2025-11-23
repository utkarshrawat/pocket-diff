document.addEventListener("DOMContentLoaded", () => {
    const navHTML = `
        <a href="/" class="logo" style="text-decoration:none;">
            ⚡ Pocket<span style="color:#3b82f6">Diff</span>
        </a>
        <div class="nav-links">
            <a href="/diff/" class="${isActive('diff')}">⚖️ Diff</a>
            <a href="/formatter/" class="${isActive('formatter')}">✨ Format</a>
            <a href="/tools/" class="${isActive('tools')}">🛠️ Dev Tools</a>
            <a href="/images/" class="${isActive('images')}">🖼️ Images</a>
            <a href="/pdf/" class="${isActive('pdf')}">📄 PDF</a>
            <a href="/calculator/" class="${isActive('calculator')}">💸 Finance</a>
        </div>
    `;
    
    const navElement = document.querySelector('nav');
    if (navElement) navElement.innerHTML = navHTML;
});

function isActive(key) {
    const path = window.location.pathname;
    // If we are at root, no tab is active (it's the dashboard)
    if (path === '/' || path.endsWith('index.html')) {
        // Unless we are inside a folder (e.g. /diff/index.html)
        if(key !== '' && path.includes(key)) return 'active-link';
        return '';
    }
    return path.includes(key) ? 'active-link' : '';
}