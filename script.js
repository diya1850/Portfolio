document.addEventListener('DOMContentLoaded', () => {
    /* --- Loading Screen --- */
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        document.body.style.overflow = 'auto';
        
        // Trigger split letters initialization
        initTextReveals();
        // Trigger initial observer setup
        initScrollObservers();
    }, 1500); // reduced loading screen time slightly for responsiveness

    /* --- Custom Cursor with Lerp physics and coarse pointer detection --- */
    const cursor = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursor-follower');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    
    if (!isTouchDevice && window.innerWidth > 768 && cursor && cursorFollower) {
        document.body.classList.add('has-custom-cursor');
        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        // Smooth physics loop for the trailing ring
        function animateCursor() {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;
            cursorFollower.style.left = followerX + 'px';
            cursorFollower.style.top = followerY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effect to interactive elements
        const updateInteractiveHover = () => {
            const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, .project-card, .skill-profile-card, .param-slider, .leader-card, .cert-card, .satellite-tag');
            interactiveElements.forEach(el => {
                if (el.dataset.hasCursorHover) return;
                el.dataset.hasCursorHover = 'true';
                
                el.addEventListener('mouseenter', () => {
                    document.body.classList.add('hover-effect');
                });
                el.addEventListener('mouseleave', () => {
                    document.body.classList.remove('hover-effect');
                });
            });
        };
        updateInteractiveHover();
        
        // Run update when elements might dynamically load
        setTimeout(updateInteractiveHover, 1000);
    }

    /* --- Theme Toggle (Dark/Light Mode) --- */
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn.querySelector('i');
    let isDarkMode = localStorage.getItem('theme') !== 'light';
    
    function updateTheme() {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            themeIcon.className = 'fas fa-sun';
            
            if(window.pJSDom && window.pJSDom[0]) {
                window.pJSDom[0].pJS.particles.color.value = "#7B2FFF";
                window.pJSDom[0].pJS.particles.line_linked.color = "#00E5FF";
                window.pJSDom[0].pJS.fn.particlesRefresh();
            }
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
            themeIcon.className = 'fas fa-moon';
            
            if(window.pJSDom && window.pJSDom[0]) {
                window.pJSDom[0].pJS.particles.color.value = "#7B2FFF";
                window.pJSDom[0].pJS.particles.line_linked.color = "#7B2FFF";
                window.pJSDom[0].pJS.fn.particlesRefresh();
            }
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
    
    updateTheme();
    themeBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        updateTheme();
    });

    /* --- Resume Dropdown & Simulated Download Loader --- */
    const resumeToggle = document.getElementById('resume-toggle-btn');
    const resumeDropdown = document.querySelector('.resume-dropdown');
    
    if (resumeToggle && resumeDropdown) {
        const resumeMenu = resumeDropdown.querySelector('.resume-menu');

        // ── Portal: move menu to <body> so it is never clipped by an ancestor
        //    transform or overflow:hidden on any ancestor of .resume-dropdown ──
        document.body.appendChild(resumeMenu);
        resumeMenu.style.position = 'absolute';

        function positionMenu() {
            const rect = resumeToggle.getBoundingClientRect();
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            resumeMenu.style.top  = (rect.bottom + scrollY + 10) + 'px';
            resumeMenu.style.left = (rect.left  + scrollX) + 'px';
        }

        function openMenu() {
            positionMenu();
            resumeMenu.classList.add('active');
            resumeDropdown.classList.add('active'); // drives chevron rotation
        }

        function closeMenu() {
            resumeMenu.classList.remove('active');
            resumeDropdown.classList.remove('active');
        }

        resumeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            resumeMenu.classList.contains('active') ? closeMenu() : openMenu();
        });

        // Close when clicking anywhere outside
        document.addEventListener('click', (e) => {
            if (!resumeDropdown.contains(e.target) && !resumeMenu.contains(e.target)) {
                closeMenu();
            }
        });

        // Reposition on scroll / resize so the menu tracks the button
        window.addEventListener('scroll', () => {
            if (resumeMenu.classList.contains('active')) positionMenu();
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (resumeMenu.classList.contains('active')) positionMenu();
        });

        const resumeItems = resumeMenu.querySelectorAll('.resume-item');
        resumeItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Don't prevent default — allow native download to proceed
                if (this.classList.contains('generating')) return;
                this.classList.add('generating');
                const progressBar = this.querySelector('.download-progress-bar');
                
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (progress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            this.classList.remove('generating');
                            if (progressBar) progressBar.style.width = '0%';
                        }, 500);
                    }
                }, 120);
            });
        });
    }

    /* --- Skills Synthesis Lab Handler --- */
    const profileCards = document.querySelectorAll('.skill-profile-card');
    const paramSets = document.querySelectorAll('.parameter-set');
    const logsContainer = document.getElementById('console-logs');
    const synthesizeBtn = document.getElementById('synthesize-btn');
    const aiOrb = document.getElementById('ai-orb');
    
    // Model metadata descriptions
    const modelDescriptions = {
        gtm: "Model: Diya-GTM-v2.1 | Deployed: Live | Purpose: Automated Lead Gen & CPC Optimization",
        analytics: "Model: Diya-Analyst-v3.0 | Deployed: Live | Purpose: Interactive DAX Metrics & Dashboards",
        automation: "Model: Diya-Automate-v1.8 | Deployed: Live | Purpose: n8n Flow Pipelines & Voice Agent AI",
        content: "Model: Diya-Creator-v2.0 | Deployed: Live | Purpose: LinkedIn Social Outreach & Stage Branding"
    };

    function addLogLine(text, type = 'normal') {
        if (!logsContainer) return;
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        line.textContent = `[${timeStr}] ${text}`;
        logsContainer.appendChild(line);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Tabs switching
    profileCards.forEach(card => {
        card.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            // Check if synthesis is currently running
            if (synthesizeBtn && synthesizeBtn.classList.contains('synthesizing')) {
                addLogLine("[WARNING] Model switch blocked. Synthesis pipeline currently active.", "system");
                return;
            }

            profileCards.forEach(c => c.classList.remove('active'));
            paramSets.forEach(s => s.classList.remove('active'));

            this.classList.add('active');
            const skill = this.dataset.skill;
            const targetParamSet = document.getElementById(`params-${skill}`);
            if (targetParamSet) targetParamSet.classList.add('active');

            addLogLine(`[SYSTEM] Loaded profile model: ${modelDescriptions[skill]}`, "system");
        });
    });

    // Custom slider value update handlers
    const setupSliders = () => {
        // GTM Sliders
        const budgetSlider = document.getElementById('gtm-budget');
        const budgetVal = document.getElementById('val-gtm-budget');
        if (budgetSlider && budgetVal) {
            budgetSlider.addEventListener('input', (e) => {
                budgetVal.textContent = `$${parseInt(e.target.value).toLocaleString()}`;
            });
        }

        const precisionSlider = document.getElementById('gtm-precision');
        const precisionVal = document.getElementById('val-gtm-precision');
        const precisionLabels = { 1: "Broad Audience", 2: "Lookalike (1-2%)", 3: "ICP Hyper-Targeted" };
        if (precisionSlider && precisionVal) {
            precisionSlider.addEventListener('input', (e) => {
                precisionVal.textContent = precisionLabels[e.target.value];
            });
        }

        // Data Analyst Sliders
        const rowsSlider = document.getElementById('da-rows');
        const rowsVal = document.getElementById('val-da-rows');
        if (rowsSlider && rowsVal) {
            rowsSlider.addEventListener('input', (e) => {
                rowsVal.textContent = parseInt(e.target.value).toLocaleString();
            });
        }

        const complexitySlider = document.getElementById('da-complexity');
        const complexityVal = document.getElementById('val-da-complexity');
        const complexityLabels = { 1: "Basic Visuals", 2: "Advanced Time-Intelligence", 3: "Dynamic C-Suite Dashboards & forecasting" };
        if (complexitySlider && complexityVal) {
            complexitySlider.addEventListener('input', (e) => {
                complexityVal.textContent = complexityLabels[e.target.value];
            });
        }

        // Automation Sliders
        const nodesSlider = document.getElementById('auto-nodes');
        const nodesVal = document.getElementById('val-auto-nodes');
        if (nodesSlider && nodesVal) {
            nodesSlider.addEventListener('input', (e) => {
                nodesVal.textContent = `${e.target.value} Nodes`;
            });
        }

        const tempSlider = document.getElementById('auto-temp');
        const tempVal = document.getElementById('val-auto-temp');
        if (tempSlider && tempVal) {
            tempSlider.addEventListener('input', (e) => {
                tempVal.textContent = parseFloat(e.target.value).toFixed(2);
            });
        }

        // Content Sliders
        const freqSlider = document.getElementById('content-frequency');
        const freqVal = document.getElementById('val-content-frequency');
        if (freqSlider && freqVal) {
            freqSlider.addEventListener('input', (e) => {
                freqVal.textContent = `${e.target.value} Post${e.target.value > 1 ? 's' : ''} / wk`;
            });
        }

        const hookSlider = document.getElementById('content-hook');
        const hookVal = document.getElementById('val-content-hook');
        if (hookSlider && hookVal) {
            hookSlider.addEventListener('input', (e) => {
                let quality = "Standard";
                if (e.target.value > 70) quality = "Engaging";
                if (e.target.value > 85) quality = "Highly Catchy";
                if (e.target.value > 95) quality = "Viral Material";
                hookVal.textContent = `${quality} (${e.target.value}%)`;
            });
        }
    };
    setupSliders();

    // Waveform Animation Logic
    let waveAnimationId = null;
    function animateWaveform(isRunning) {
        const svg = document.getElementById('synthesis-waveform');
        if (!svg) return;
        const paths = svg.querySelectorAll('.wave-path');
        if (!isRunning) {
            if (waveAnimationId) {
                cancelAnimationFrame(waveAnimationId);
                waveAnimationId = null;
            }
            paths.forEach(path => {
                path.setAttribute('d', 'M0,50 C100,50 100,50 200,50 C300,50 300,50 400,50');
            });
            return;
        }

        let time = 0;
        function draw() {
            time += 0.12;
            paths.forEach((path, idx) => {
                const amp = (idx === 0) ? 20 : (idx === 1) ? 12 : 7;
                const freq = (idx === 0) ? 0.025 : (idx === 1) ? 0.04 : 0.055;
                const phase = time + (idx * 1.8);
                
                let d = `M 0 50`;
                for (let x = 0; x <= 400; x += 8) {
                    const y = 50 + Math.sin(x * freq + phase) * amp * Math.sin(x * Math.PI / 400);
                    d += ` L ${x} ${y}`;
                }
                path.setAttribute('d', d);
            });
            waveAnimationId = requestAnimationFrame(draw);
        }
        draw();
    }

    // Synthesis Execution Simulation
    if (synthesizeBtn) {
        synthesizeBtn.addEventListener('click', function() {
            if (this.classList.contains('synthesizing')) return;
            
            const activeProfile = document.querySelector('.skill-profile-card.active');
            if (!activeProfile) return;
            const skill = activeProfile.dataset.skill;

            this.classList.add('synthesizing');
            this.querySelector('.btn-text').textContent = 'Synthesizing...';
            if (aiOrb) aiOrb.classList.add('active');
            
            // Start dynamic soundwave visualizer
            animateWaveform(true);

            // Clean previous simulation run logs
            if (logsContainer) logsContainer.innerHTML = '';
            
            addLogLine(`[SYNTHESIS] Initiating pipeline for profile model: ${skill.toUpperCase()}...`, "running");
            
            // Sequence logs
            setTimeout(() => {
                addLogLine(`[ANALYZING] Querying model parameters & slider adjustments...`, "running");
            }, 500);

            setTimeout(() => {
                addLogLine(`[COMPILING] Resolving dependencies & training weights...`, "running");
            }, 1000);

            setTimeout(() => {
                // Generate specific simulated logs based on inputs
                if (skill === 'gtm') {
                    const budget = parseInt(document.getElementById('gtm-budget').value);
                    const precision = parseInt(document.getElementById('gtm-precision').value);
                    const focusSelect = document.getElementById('gtm-focus');
                    const focusLabel = focusSelect.options[focusSelect.selectedIndex].text;
                    
                    const impressions = budget * 22;
                    const clicks = Math.round(impressions * (0.012 * precision));
                    const arr = Math.round(clicks * 0.15 * 90);
                    const roi = "156.61%";

                    addLogLine(`[DEPLOYING] Meta Ads campaign focus: "${focusLabel}" active.`, "running");
                    setTimeout(() => {
                        addLogLine(`[OUTPUT] Target impressions: ${impressions.toLocaleString()} | Targeted clicks: ${clicks.toLocaleString()}`, "metric");
                        addLogLine(`[OUTPUT] Expected SaaS pipeline generated: $${arr.toLocaleString()} ARR | Campaign Marketing ROI: ${roi}`, "metric");
                        addLogLine(`[SUCCESS] B2B lead generation complete. Quarterly R&R award triggered!`, "success");
                        endSynthesis();
                    }, 800);

                } else if (skill === 'analytics') {
                    const rows = parseInt(document.getElementById('da-rows').value);
                    const complexity = parseInt(document.getElementById('da-complexity').value);
                    const toolSelect = document.getElementById('da-tool');
                    const toolLabel = toolSelect.options[toolSelect.selectedIndex].text;
                    
                    const queryTime = Math.round((rows / 100000) * 12 + 40);

                    addLogLine(`[QUERYING] Loading dataset. Row count: ${rows.toLocaleString()}...`, "running");
                    setTimeout(() => {
                        addLogLine(`[COMPILING] Complex DAX measures calculated in ${queryTime}ms. Complexity level: ${complexity}/3`, "metric");
                        addLogLine(`[DEPLOYING] Rendering interactive dashboard on: "${toolLabel}".`, "metric");
                        addLogLine(`[SUCCESS] Data storytelling engine online. Executive reports successfully exported!`, "success");
                        endSynthesis();
                    }, 800);

                } else if (skill === 'automation') {
                    const nodes = parseInt(document.getElementById('auto-nodes').value);
                    const temp = parseFloat(document.getElementById('auto-temp').value);
                    const channelSelect = document.getElementById('auto-channel');
                    const channelLabel = channelSelect.options[channelSelect.selectedIndex].text;

                    addLogLine(`[CONNECTING] Connecting n8n automation nodes. Count: ${nodes}...`, "running");
                    setTimeout(() => {
                        addLogLine(`[AI ENGINE] Prompt generated at LLM Temperature: ${temp}`, "metric");
                        addLogLine(`[ROUTING] Dynamic webhook request sent to "${channelLabel}".`, "metric");
                        addLogLine(`[SUCCESS] Workflow automated. 24/7 business communication live!`, "success");
                        endSynthesis();
                    }, 800);

                } else if (skill === 'content') {
                    const freq = document.getElementById('content-frequency').value;
                    const hook = document.getElementById('content-hook').value;
                    const formatSelect = document.getElementById('content-format');
                    const formatLabel = formatSelect.options[formatSelect.selectedIndex].text;

                    addLogLine(`[PLANNING] Structuring editorial outreach strategy. Frequency: ${freq} times/week...`, "running");
                    setTimeout(() => {
                        addLogLine(`[OPTIMIZING] Copy hook rating: ${hook}% quality score (highly catching)`, "metric");
                        addLogLine(`[SCHEDULING] Outbound posts generated for: "${formatLabel}".`, "metric");
                        addLogLine(`[SUCCESS] Outreaches active. Brand reach expanded by +64% (+235 net followers)!`, "success");
                        endSynthesis();
                    }, 800);
                }
            }, 1600);
        });

        function endSynthesis() {
            setTimeout(() => {
                synthesizeBtn.classList.remove('synthesizing');
                synthesizeBtn.querySelector('.btn-text').textContent = 'Synthesize Skill Output';
                if (aiOrb) aiOrb.classList.remove('active');
                animateWaveform(false);
            }, 600);
        }
    }

    /* --- Navbar Scroll Effect --- */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* --- Mobile Menu Toggle --- */
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu .nav-link');

    hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    /* --- Active Nav Link Update on Scroll --- */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    /* --- Neural Network Canvas Simulations --- */
    function initNeuroCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = canvas.parentElement.offsetWidth;
        let height = canvas.height = canvas.parentElement.offsetHeight;

        window.addEventListener('resize', () => {
            if (canvas.parentElement) {
                width = canvas.width = canvas.parentElement.offsetWidth;
                height = canvas.height = canvas.parentElement.offsetHeight;
            }
        });

        const nodes = [];
        const maxNodes = Math.min(30, Math.floor((width * height) / 30000));
        const connectionDist = 140;

        for (let i = 0; i < maxNodes; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1.5
            });
        }

        const pulses = [];

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            // Draw nodes
            nodes.forEach((n, idx) => {
                n.x += n.vx;
                n.y += n.vy;

                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;

                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
                ctx.fill();

                // Connections
                for (let j = idx + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dx = n.x - n2.x;
                    const dy = n.y - n2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDist) {
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(n2.x, n2.y);
                        const alpha = (1 - dist / connectionDist) * 0.12;
                        ctx.strokeStyle = `rgba(123, 79, 255, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        // Chance to spawn pulse
                        if (Math.random() < 0.0003 && pulses.length < 10) {
                            pulses.push({
                                from: n,
                                to: n2,
                                progress: 0,
                                speed: Math.random() * 0.015 + 0.008
                            });
                        }
                    }
                }
            });

            // Draw pulses
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.progress += p.speed;

                if (p.progress >= 1) {
                    pulses.splice(i, 1);
                    continue;
                }

                const px = p.from.x + (p.to.x - p.from.x) * p.progress;
                const py = p.from.y + (p.to.y - p.from.y) * p.progress;

                ctx.beginPath();
                ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#00E5FF';
                ctx.shadowColor = '#00E5FF';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            requestAnimationFrame(animate);
        }
        animate();
    }

    initNeuroCanvas('hero-neuro-canvas');
    initNeuroCanvas('skills-neuro-canvas');

    /* --- About photo Sparks/Particles Emitter --- */
    const emitter = document.querySelector('.orbit-particle-emitter');
    if (emitter) {
        setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'orbit-particle';
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 135;
            const x = Math.cos(angle) * radius + 145; // half of 290 wrapper size
            const y = Math.sin(angle) * radius + 145;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';

            const dx = (Math.random() - 0.5) * 50;
            const dy = -60 - Math.random() * 60;
            particle.style.setProperty('--p-dx', `${dx}px`);
            particle.style.setProperty('--p-dy', `${dy}px`);
            particle.style.animationDuration = `${2 + Math.random() * 2}s`;

            emitter.appendChild(particle);
            setTimeout(() => {
                particle.remove();
            }, 3000);
        }, 200);
    }

    /* --- 3D Hover Tilt Effect for Projects --- */
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            card.classList.add('active-tilt');
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            
            const angleX = -(y - yc) / 12;
            const angleY = (x - xc) / 12;
            
            card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('active-tilt');
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    /* --- Scroll Parallax Layers --- */
    // Generate floating parallax shapes
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
        const shapes = ['hexagon', 'circle', 'triangle'];
        for (let i = 0; i < 8; i++) {
            const shape = document.createElement('div');
            const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
            shape.className = `parallax-shape ${shapeType}`;
            
            // Random horizontal/vertical layout
            shape.style.left = `${Math.random() * 90}%`;
            shape.style.top = `${Math.random() * 85 + 5}%`;
            
            // Parallax speed
            const speed = (Math.random() * 0.15 + 0.05) * (Math.random() > 0.5 ? 1 : -1);
            shape.setAttribute('data-speed', speed);
            mainContainer.appendChild(shape);
        }
    }

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax-shape');
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-speed'));
            const coords = scrolled * speed;
            el.style.transform = `translateY(${coords}px) rotate(${scrolled * 0.1}deg)`;
        });
    });

    /* --- Split Letters Reveal Handler --- */
    function initTextReveals() {
        const revealElements = document.querySelectorAll('.letters-reveal');
        revealElements.forEach(element => {
            splitLetters(element);
        });
    }

    function splitLetters(element) {
        const childNodes = Array.from(element.childNodes);
        element.innerHTML = '';
        let delayCount = 0;

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const words = node.textContent.split(/(\s+)/);
                words.forEach(word => {
                    if (word.trim() === '') {
                        element.appendChild(document.createTextNode(word));
                        return;
                    }
                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word';
                    Array.from(word).forEach(char => {
                        const charSpan = document.createElement('span');
                        charSpan.className = 'letter';
                        charSpan.style.transitionDelay = `${delayCount * 0.015}s`;
                        charSpan.textContent = char;
                        wordSpan.appendChild(charSpan);
                        delayCount++;
                    });
                    element.appendChild(wordSpan);
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Preserve gradient-text spans intact so the CSS background-clip gradient works
                if (node.classList && node.classList.contains('gradient-text')) {
                    const clone = node.cloneNode(true);
                    clone.style.transitionDelay = `${delayCount * 0.015}s`;
                    delayCount += (clone.textContent || '').length;
                    element.appendChild(clone);
                } else {
                    const clone = node.cloneNode(true);
                    splitLetters(clone);
                    const letters = clone.querySelectorAll('.letter');
                    letters.forEach(letter => {
                        letter.style.transitionDelay = `${delayCount * 0.015}s`;
                        delayCount++;
                    });
                    element.appendChild(clone);
                }
            }
        });
    }

    /* --- Scroll-Triggered Observers --- */
    function initScrollObservers() {
        // Setup classes
        const experienceItems = document.querySelectorAll('.timeline-item');
        experienceItems.forEach((item, idx) => {
            item.classList.add(idx % 2 === 0 ? 'reveal-left' : 'reveal-right');
        });

        const mktCards = document.querySelectorAll('.mkt-card');
        mktCards.forEach(card => card.classList.add('deal-card'));

        const achievements = document.querySelectorAll('.achieve-card');
        achievements.forEach((card, idx) => {
            card.classList.add('polaroid-card');
            card.style.setProperty('--p-rot', `${(idx % 2 === 0 ? -1 : 1) * (2 + Math.random() * 4)}deg`);
        });

        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => card.classList.add('stagger-reveal'));

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    
                    // Trigger counters when target containing counters is visible
                    const counters = entry.target.querySelectorAll('.counter, .counter-scroll');
                    counters.forEach(c => startScrollCounter(c));

                    // Trigger progress bars if inside this section
                    const bars = entry.target.querySelectorAll('.progress');
                    bars.forEach(bar => {
                        bar.style.transform = 'scaleX(1)';
                    });

                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Register elements
        document.querySelectorAll('.reveal-text, .reveal, .timeline-item, .stagger-reveal, .mkt-card, .achieve-card, .about-container, #skills').forEach(el => {
            observer.observe(el);
        });
    }

    /* --- Advanced Animated Counters --- */
    function startScrollCounter(counterEl) {
        if (counterEl.classList.contains('counted')) return;
        counterEl.classList.add('counted');
        
        const target = parseFloat(counterEl.getAttribute('data-target'));
        const isDecimal = target % 1 !== 0;
        let count = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quad
            const ease = progress * (2 - progress);
            const currentVal = ease * target;
            
            if (isDecimal) {
                counterEl.textContent = currentVal.toFixed(2);
            } else {
                counterEl.textContent = Math.floor(currentVal);
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                if (isDecimal) {
                    counterEl.textContent = target.toFixed(2);
                } else {
                    counterEl.textContent = target;
                }
            }
        }
        requestAnimationFrame(update);
    }

    /* --- Form Submission (Web3Forms API) --- */
    const contactForm = document.querySelector('.contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            const formData = new FormData(contactForm);
            formData.append("access_key", "4cba792c-b773-4916-b54c-0805afeb1a5b");

            try {
                const response = await fetch("https://api.web3forms.com/submit", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    btn.innerHTML = 'Sent! <i class="fas fa-check"></i>';
                    btn.style.background = '#10b981';
                    btn.style.opacity = '1';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                        contactForm.reset();
                    }, 3000);
                } else {
                    throw new Error("Form submission failed");
                }
            } catch (error) {
                btn.innerHTML = 'Error! <i class="fas fa-times"></i>';
                btn.style.background = '#ef4444';
                btn.style.opacity = '1';
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    /* --- Initialize Particles.js --- */
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 25, // reduced global density since we have localized neuro canvases
                    "density": {
                        "enable": true,
                        "value_area": 1000
                    }
                },
                "color": {
                    "value": "#7B2FFF"
                },
                "shape": {
                    "type": "circle"
                },
                "opacity": {
                    "value": 0.15
                },
                "size": {
                    "value": 2.5,
                    "random": true
                },
                "line_linked": {
                    "enable": true,
                    "distance": 180,
                    "color": isDarkMode ? "#00E5FF" : "#7B2FFF",
                    "opacity": 0.1,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 1.2
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "resize": true
                }
            },
            "retina_detect": true
        });
    }
});
