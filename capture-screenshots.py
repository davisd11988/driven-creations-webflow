#!/usr/bin/env python3
"""Capture screenshots from live client websites for project subpages."""

from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "/Users/drivencreations/Desktop/driven-creations-webflow/images/work"

SITES = {
    "forgent": {
        "url": "https://www.forgentpower.com",
        "viewport": {"width": 1440, "height": 900},
        "captures": [
            {"name": "forgent-showcase.jpg", "scroll_pct": 0, "desc": "Hero section"},
            {"name": "forgent-approach-1.jpg", "scroll_pct": 25, "desc": "About/services section"},
            {"name": "forgent-approach-2.jpg", "scroll_pct": 55, "desc": "Middle content section"},
        ]
    },
    "pwrq": {
        "url": "https://www.pwrq.com",
        "viewport": {"width": 1440, "height": 900},
        "captures": [
            {"name": "pwrq-showcase.jpg", "scroll_pct": 0, "desc": "Hero section"},
            {"name": "pwrq-approach-1.jpg", "scroll_pct": 30, "desc": "Products/services section"},
            {"name": "pwrq-approach-2.jpg", "scroll_pct": 60, "desc": "Lower content section"},
        ]
    },
    "vtech": {
        "url": "https://www.v-techsolutions.net",
        "viewport": {"width": 1440, "height": 900},
        "captures": [
            {"name": "vtech-showcase.jpg", "scroll_pct": 0, "desc": "Hero section"},
            {"name": "vtech-approach-1.jpg", "scroll_pct": 20, "desc": "About/services section"},
            {"name": "vtech-approach-2.jpg", "scroll_pct": 45, "desc": "Services detail section"},
        ]
    }
}

def nuke_overlays(page):
    """Aggressively remove all cookie banners, overlays, popups via JS."""
    page.evaluate("""
        () => {
            // OneTrust (used by Forgent/PWRQ)
            const onetrust = document.getElementById('onetrust-banner-sdk');
            if (onetrust) onetrust.remove();
            const onetrustOverlay = document.getElementById('onetrust-consent-sdk');
            if (onetrustOverlay) onetrustOverlay.remove();
            const trustArc = document.querySelector('.truste_box_overlay');
            if (trustArc) trustArc.remove();

            // Generic cookie/consent banners
            const keywords = ['cookie', 'consent', 'gdpr', 'privacy-banner', 'cc-banner'];
            document.querySelectorAll('div, section, aside, footer').forEach(el => {
                const id = (el.id || '').toLowerCase();
                const cls = (el.className || '').toLowerCase();
                for (const kw of keywords) {
                    if (id.includes(kw) || cls.includes(kw)) {
                        el.remove();
                        break;
                    }
                }
            });

            // Remove any fixed/sticky positioned elements at bottom of page
            // that look like cookie banners (tall, at bottom)
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                if ((style.position === 'fixed' || style.position === 'sticky') &&
                    parseInt(style.bottom) <= 10 &&
                    el.offsetHeight > 80 &&
                    el.offsetWidth > window.innerWidth * 0.5) {
                    el.remove();
                }
            });
        }
    """)
    page.wait_for_timeout(500)
    print("  Removed all overlays/banners via JS")

def capture_screenshots():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for site_name, config in SITES.items():
            print(f"\n=== Capturing {site_name} from {config['url']} ===")

            page = browser.new_page(viewport=config["viewport"])

            try:
                page.goto(config["url"], wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(3000)

                # Nuke all overlays aggressively
                nuke_overlays(page)
                page.wait_for_timeout(1000)

                total_height = page.evaluate("() => document.body.scrollHeight")
                print(f"  Page height: {total_height}px")

                for capture in config["captures"]:
                    scroll_y = int(total_height * capture["scroll_pct"] / 100)
                    page.evaluate(f"window.scrollTo(0, {scroll_y})")
                    page.wait_for_timeout(1500)

                    # Re-nuke in case anything lazy-loaded
                    nuke_overlays(page)

                    output_path = os.path.join(OUTPUT_DIR, capture["name"])
                    page.screenshot(
                        path=output_path,
                        type="jpeg",
                        quality=90,
                        clip={
                            "x": 0,
                            "y": 0,
                            "width": config["viewport"]["width"],
                            "height": config["viewport"]["height"]
                        }
                    )
                    print(f"  ✓ {capture['name']} ({capture['desc']}) - scroll {capture['scroll_pct']}%")

            except Exception as e:
                print(f"  ✗ Error capturing {site_name}: {e}")
            finally:
                page.close()

        browser.close()

    print("\n=== All captures complete ===")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.startswith(("forgent-", "pwrq-", "vtech-")):
            path = os.path.join(OUTPUT_DIR, f)
            size = os.path.getsize(path)
            print(f"  {f}: {size/1024:.0f} KB")

if __name__ == "__main__":
    capture_screenshots()
