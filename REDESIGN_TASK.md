# OUTR COMPLETE REDESIGN

You are redesigning OUTR (AI Outreach & Lead Generation Agency) from scratch. The current codebase is at /Users/piyushkumarsharma/Documents/ChatGPT/Outr

## CURRENT STATE
- TypeScript monorepo: React/Vite web app + Fastify API + shared Zod contracts
- Has: Command center, Lead explorer with MapLibre map, Campaign studio, Agent pool (18 agents), Inbox
- UI is dark-themed but user HATES IT - wants completely futuristic skeuomorphic design
- Integrated with OutreachOS Python engine via bridge

## YOUR MISSION
1. RESEARCH competitors deeply: Apollo, Instantly, Smartlead, Lemlist, Clay, Reply, AiSDR, Artisan, 11x, Regie, Common Room, Unify, HeyReach, Saleshandy. Find their best features, MVP scope, unique aspects.
2. REDESIGN the UI completely - futuristic skeuomorphic. Think: glassmorphism, neon accents, holographic elements, depth, lighting effects, modern typography, smooth animations. NOT the current dark flat design.
3. ADD native map features: filter/sort leads by location, territory heatmaps, radius search, polygon territories
4. ADD all missing features from competitors that make sense
5. CREATE new agents and subagents integrated into the common pool
6. INTEGRATE MCP servers and tools
7. MAKE EVERYTHING WORK - all buttons, all screens, all features
8. SHIP a complete product ready for customers

## DESIGN DIRECTION
- Futuristic skeuomorphic: glass panels, neon glows, depth shadows, holographic accents, smooth micro-interactions
- Color palette: deep space blacks, electric teals, warm amber signals, soft white text
- Typography: modern geometric sans-serif with monospace accents
- Animations: smooth, purposeful, not gimmicky
- Layout: spacious, breathable, information-dense but clean

## FEATURES TO ADD/ENHANCE
- Territory heatmap on map (fit score, intent, reply rate, whitespace)
- Advanced lead filtering (saved views, smart segments)
- Campaign A/B testing with statistical significance
- Real-time agent monitoring with live status
- Client portal mockup
- Advanced analytics dashboard
- Lead scoring explanation (why this score?)
- Email verification status with confidence levels
- Suppression management with bulk operations
- Import/export workflows
- Webhook configuration UI
- Provider cost tracking
- Margin calculator per campaign

## AGENTS TO CREATE
- Territory Manager (map-based lead distribution)
- Compliance Auditor (CAN-SPAM, GDPR, CASL checks)
- Deliverability Monitor (inbox placement, warmup status)
- Client Reporter (automated weekly/monthly reports)
- Signal Detector (trigger-based lead revival)

## TECH STACK
- Keep: React, Vite, TypeScript, Fastify, Zod, MapLibre GL JS
- Add: Framer Motion for animations, Recharts for charts, Zustand for state
- Consider: Tailwind CSS for rapid styling

## DELIVERABLE
- Complete working product
- All features functional
- All buttons work
- All screens responsive
- Production build passes
- Tests pass

START NOW. Research, design, implement, test, ship. Do not stop until complete.
