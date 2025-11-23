// --- CONFIGURATION ---
// Replace this with your actual Measurement ID from Google Analytics
const GA_MEASUREMENT_ID = 'G-BQV9BKMWHP'; 

(function() {
    // 1. Load the Google Tag Manager Script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // 2. Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    // 3. Configure
    gtag('config', GA_MEASUREMENT_ID, {
        'send_page_view': true,
        'anonymize_ip': true // Better for privacy
    });

    // 4. Auto-Track Feature Usage (Clicks on Action Buttons)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            // Try to identify the button by Text or ID
            const label = btn.innerText || btn.id || 'Unknown Button';
            const page = window.location.pathname;
            
            // Send Event to GA
            gtag('event', 'feature_click', {
                'event_category': 'Tools',
                'event_label': label,
                'page_path': page
            });
        }
    });

    console.log("📊 Analytics Loaded");
})();