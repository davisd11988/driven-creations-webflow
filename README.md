# Driven Creations - Webflow Migration

Custom web design, AI video advertising, and branding agency website. This repository contains the static HTML/CSS/JS source and Webflow HTMLtoFlow conversion files for migrating to Webflow.

## Project Structure

```
/
  index.html              # Homepage
  about.html              # About page
  services.html           # Services page
  work.html               # Work/Portfolio page
  contact.html            # Contact page
  work/                   # 15 project case study subpages
  css/                    # Stylesheets (shared.css, animations)
  js/                     # JavaScript (interactions, scroll, video)
  images/                 # All images, logos, thumbnails
  videos/                 # Video assets (hero, project showcases)
  fonts/                  # Custom fonts (Integral CF)
  webflow-export/         # HTMLtoFlow conversion files
```

## Webflow Export Structure

The `webflow-export/` directory contains all files needed for HTMLtoFlow import:

```
webflow-export/
  WEBFLOW-IMPORT-GUIDE.txt      # Step-by-step import instructions
  GLOBAL-CSS.txt                 # Shared CSS for Webflow Custom Code

  PAGE-Home/                     # 13 sections (Loader through Footer)
  PAGE-About/                    # 6 sections
  PAGE-Services/                 # 3 sections
  PAGE-Work/                     # 2 sections
  PAGE-Contact/                  # 3 sections
  PAGE-ProjectTemplate/          # CMS template + data for 15 projects
```

Each section has paired files:
- `SECTION-[Name]-HTML.txt` - HTMLtoFlow-compatible HTML (semantic tags converted to divs)
- `SECTION-[Name]-CSS.txt` - Extracted CSS for that section's classes

## Tech Stack

- **Fonts**: Integral CF (custom), Inter, Plus Jakarta Sans (Google Fonts)
- **Design**: Dark theme (#090316 base), purple accent (#7c3aed), glassmorphism
- **Animations**: CSS @keyframes, scroll-triggered reveals, marquee scrolls
- **Video**: HTML5 video with hover-play, YouTube modal embeds
- **Target**: Webflow with HTMLtoFlow app for import

## Pages

| Page | Sections | Description |
|------|----------|-------------|
| Home | 13 | Loader, Navbar, Hero, Marquee, Services, Portfolio, Process, Story, Characters, Collision, Testimonials, CTA, Footer |
| About | 6 | Hero, Superpowers, Characters, Clash, Founder, Client Marquee |
| Services | 3 | Hero, Service Detail Cards, Process |
| Work | 2 | Hero, Full Portfolio Grid |
| Contact | 3 | Hero, Contact Form, Contact Info |
| Projects (x15) | 7 each | Hero, Overview, Showcase, Approach, Results, More Projects, CTA |

## Project Subpages (15 Total)

- Forgent Power
- Paramount Development
- PwrQ
- Olunike
- V-Tech Solutions
- Akkuun
- Drive the Hero (AI Character)
- Deadline the Villain (AI Character)
- Style by Chanel
- Safety & Security Consultants
- Iron Guardian
- Gundam Strike (AI Character)
- Premium Title Services
- Driven Creations (Self-branding)
- Nia Stokes Photography

## Webflow Import Workflow

1. Create Webflow site and add Global CSS + Google Fonts to Custom Code
2. Open HTMLtoFlow app in Webflow Designer
3. For each section: paste HTML into HTML editor, CSS into CSS editor, click Convert
4. Shared components (Navbar, CTA, Footer) become Webflow Symbols
5. Create CMS Collection for Projects using data from `CMS-DATA.json`
6. Upload all assets to Webflow Asset Manager

## Live Site

- **Current**: [drivencreations.com](https://www.drivencreations.com)
- **Webflow Staging**: driven-creations-v2.webflow.io

## BBB Accredited

[BBB Profile](https://www.bbb.org/us/md/laurel/profile/brand-development/driven-creations-llc-0011-90349113)

---

Built by [Driven Creations](https://www.drivencreations.com) | Fulton, MD
