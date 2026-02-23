# Driven Creations - Webflow Migration Project

## Project Overview

This is the Driven Creations agency website being migrated from static HTML/CSS/JS to Webflow. The site features a dark theme design with purple accents, glassmorphism effects, scroll-triggered animations, and AI character storytelling.

## Important Context

### Site Architecture
- **5 main pages**: Home, About, Services, Work, Contact
- **15 project subpages**: Each follows an identical template structure
- **3 shared components** (Webflow Symbols): Navbar, CTA Section, Footer
- **CMS**: Projects collection for the 15 case studies

### Design System
- **Background**: #090316 (deep dark purple-black)
- **Primary accent**: #7c3aed (purple)
- **Secondary accent**: #22d3ee (cyan, used in gradients)
- **Text colors**: #ffffff (headings), #d4d4d8 (body), #a1a1aa (muted), #71717a (subtle)
- **Fonts**:
  - Integral CF (headings, bold/extrabold) - custom, needs manual upload to Webflow
  - Inter (body text) - Google Fonts
  - Plus Jakarta Sans (subheadings) - Google Fonts
- **Border radius**: 16px (cards), 12px (buttons), 50% (avatars)
- **Glassmorphism**: `background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);`

### HTMLtoFlow Conversion Rules
When creating or editing section export files:
1. Replace `<h1>` through `<h6>` with `<div>` (keep all classes)
2. Replace `<p>` with `<div>` (keep all classes)
3. Replace `<button>` with `<div>` (keep all classes)
4. Replace `<input>`, `<label>`, `<textarea>` with `<div>` (mark for Webflow native form)
5. Keep `<a>`, `<img>`, `<video>`, `<svg>`, `<section>`, `<nav>`, `<span>` as-is
6. Remove all `<script>` tags (Webflow Interactions replace them)

### Key URLs
- **GitHub**: https://github.com/davisd11988/driven-creations-webflow
- **Live site**: https://www.drivencreations.com
- **Webflow Designer**: https://driven-creations-v2.design.webflow.com/
- **Webflow Staging**: https://driven-creations-v2.webflow.io/
- **BBB**: https://www.bbb.org/us/md/laurel/profile/brand-development/driven-creations-llc-0011-90349113

### Project Client Links
When referencing "Visit Site" links for projects, use these exact URLs:
- Forgent Power: https://www.forgentpower.com/
- Paramount Development: https://www.paramountdevelopmentllc.com/
- PwrQ: https://www.pwrq.com/
- V-Tech Solutions: https://www.v-techsolutions.net/
- Olunike: https://www.olunikelaw.com/
- Style by Chanel: https://stylebychanel.com/
- Nia Stokes Photography: https://www.niastokesphotography.com/

### File Organization
- `/webflow-export/PAGE-[Name]/` - HTMLtoFlow conversion files per page
- Each section has paired `-HTML.txt` and `-CSS.txt` files
- `/webflow-export/PAGE-ProjectTemplate/CMS-DATA.json` - All 15 project data entries

### Webflow-Specific Notes
- Global CSS goes in Site Settings > Custom Code > Head
- Google Fonts loaded via `<link>` tags in Custom Code Head
- Integral CF font files must be uploaded manually in Webflow Font settings
- Navbar, CTA, and Footer should be Webflow Symbols for cross-page reuse
- Use Webflow Interactions 2.0 for scroll reveals (replace JS `IntersectionObserver`)
- Video hover-play requires custom Webflow embed or interactions

### Business Info
- **Company**: Driven Creations LLC
- **Location**: 8115 Maple Lawn Blvd Suite 350, Fulton, MD 20759
- **Phone**: (301) 532-9902
- **Email**: info@drivencreations.com
- **Tagline**: "Stay Driven."
