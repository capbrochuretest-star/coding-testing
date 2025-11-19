
import React, { useRef, useEffect, useCallback } from 'react';
import { Turkey, GameState, Particle } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, OFFICE_IMAGE_URL } from '../constants';
import { getTurkeyLegalAdvice } from '../services/geminiService';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  gameState: GameState;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setLastAdvice: React.Dispatch<React.SetStateAction<string | null>>;
  timer: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setScore, setLastAdvice, timer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const turkeysRef = useRef<Turkey[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  
  // Load background image
  useEffect(() => {
    const img = new Image();
    img.src = OFFICE_IMAGE_URL;
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, []);

  // Start/Stop Ambient Sound
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        audioService.startAmbient();
    } else {
        audioService.stopAmbient();
    }
    return () => audioService.stopAmbient();
  }, [gameState]);

  // Spawn Logic
  const spawnTurkey = useCallback(() => {
    const isLeftStart = Math.random() > 0.5;
    const scale = 0.4 + Math.random() * 0.8; // Random size
    
    // Adjust Y based on scale to fake perspective (bigger = closer/lower)
    // y range: 400 (horizon) to 750 (foreground)
    const y = 380 + (scale * 320); 
    const x = isLeftStart ? -150 : CANVAS_WIDTH + 150;
    
    const newTurkey: Turkey = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      scale,
      speedX: (isLeftStart ? 1 : -1) * (3 + Math.random() * 4),
      speedY: 0,
      state: 'RUNNING',
      variant: Math.floor(Math.random() * 3), // 0: Normal, 1: Partner (Suit/Briefcase), 2: Intern (Coffee)
      frame: Math.random() * 100,
      deathTimer: 0,
    };
    
    turkeysRef.current.push(newTurkey);
    
    // 30% chance to gobble on spawn
    if (Math.random() > 0.7) {
        audioService.playGobble();
    }
  }, []);

  // --- DRAWING ENGINE ---

  const drawFeather = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, length: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(length / 2, 0, length / 2, length / 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawTurkey = (ctx: CanvasRenderingContext2D, turkey: Turkey, time: number) => {
    ctx.save();
    ctx.translate(turkey.x, turkey.y);
    
    // Flip coordinate system if moving left
    const dir = turkey.speedX < 0 ? -1 : 1;
    ctx.scale(dir * turkey.scale, turkey.scale);

    // Animation constants
    const runCycle = (time * 0.4) + turkey.frame; 
    const bobY = Math.sin(runCycle * 0.5) * 5;
    const headBob = Math.sin(runCycle * 0.5 - 1) * 3;
    const legAngle1 = Math.sin(runCycle * 0.5) * 0.8;
    const legAngle2 = Math.sin(runCycle * 0.5 + Math.PI) * 0.8;

    // -- TAIL FAN (Back layer) --
    const fanSpread = 7;
    for (let i = 0; i < fanSpread; i++) {
        const angle = -Math.PI / 3 + (i / (fanSpread - 1)) * (Math.PI / 1.5);
        // Brown with white tip
        drawFeather(ctx, -25, -15 + bobY, angle - 0.2, '#3E2723', 80);
        drawFeather(ctx, -25, -15 + bobY, angle - 0.2, '#8D6E63', 70); // Light highlight
    }

    // -- LEGS --
    ctx.strokeStyle = '#FFB300'; // Yellow/Orange
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Leg 1 (Far)
    ctx.save();
    ctx.translate(0, 20 + bobY);
    ctx.rotate(legAngle2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 30);
    ctx.lineTo(10, 30); // Foot
    ctx.stroke();
    ctx.restore();

    // Leg 2 (Near)
    ctx.save();
    ctx.translate(5, 25 + bobY);
    ctx.rotate(legAngle1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 30);
    ctx.lineTo(10, 30); // Foot
    ctx.stroke();
    ctx.restore();

    // -- BODY --
    ctx.fillStyle = '#4E342E'; // Rich Brown
    ctx.beginPath();
    ctx.ellipse(0, 0 + bobY, 35, 28, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Suit / Tie for Variant 1 (Partner)
    if (turkey.variant === 1) {
        ctx.fillStyle = '#FFFFFF'; // Shirt collar
        ctx.beginPath();
        ctx.moveTo(20, 0 + bobY);
        ctx.lineTo(28, -5 + bobY);
        ctx.lineTo(28, 5 + bobY);
        ctx.fill();
        
        ctx.strokeStyle = '#1a237e'; // Blue tie
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(24, 0 + bobY);
        ctx.lineTo(20, 15 + bobY);
        ctx.stroke();
    }

    // -- WING --
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.ellipse(-5, 2 + bobY, 20, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Wing feathers
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, 2 + bobY);
    ctx.lineTo(10, 2 + bobY);
    ctx.stroke();

    // -- NECK --
    ctx.strokeStyle = '#C62828'; // Red wattle color
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(25, -5 + bobY);
    ctx.quadraticCurveTo(40, -20 + bobY + headBob, 30, -45 + bobY + headBob);
    ctx.stroke();

    // -- HEAD --
    ctx.fillStyle = '#81D4FA'; // Slightly blue fleshy head (typical of turkeys)
    ctx.beginPath();
    ctx.arc(30, -45 + bobY + headBob, 11, 0, Math.PI * 2);
    ctx.fill();

    // -- SNOOD (The dangly thing over the beak) --
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.moveTo(36, -50 + bobY + headBob);
    ctx.quadraticCurveTo(45, -40 + bobY + headBob, 42, -25 + bobY + headBob); // Dangles down
    ctx.lineTo(38, -25 + bobY + headBob);
    ctx.quadraticCurveTo(38, -40 + bobY + headBob, 32, -48 + bobY + headBob);
    ctx.fill();

    // -- BEAK --
    ctx.fillStyle = '#FFB300';
    ctx.beginPath();
    ctx.moveTo(38, -45 + bobY + headBob);
    ctx.lineTo(50, -42 + bobY + headBob);
    ctx.lineTo(38, -38 + bobY + headBob);
    ctx.fill();

    // -- WATTLE (Under chin) --
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.arc(32, -35 + bobY + headBob, 5, 0, Math.PI * 2);
    ctx.arc(34, -32 + bobY + headBob, 4, 0, Math.PI * 2);
    ctx.fill();

    // -- EYE --
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(32, -48 + bobY + headBob, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(33, -49 + bobY + headBob, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // -- ACCESSORIES --
    // Briefcase (Partner)
    if (turkey.variant === 1) {
        ctx.fillStyle = '#263238';
        ctx.save();
        ctx.translate(10, 20 + bobY);
        ctx.rotate(legAngle1 * 0.5); // Swing with leg
        ctx.fillRect(-10, 0, 25, 18);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, -2, 5, 2);
        ctx.restore();
    }

    // Coffee Cup (Intern)
    if (turkey.variant === 2) {
        ctx.fillStyle = '#ECEFF1';
        ctx.save();
        ctx.translate(25, 10 + bobY);
        ctx.rotate(Math.sin(runCycle)*0.2); // Shake slightly
        // Cup
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(2, 12);
        ctx.lineTo(10, 12);
        ctx.lineTo(12, 0);
        ctx.fill();
        // Lid
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(-1, -2, 14, 2);
        ctx.restore();
    }

    ctx.restore();
  };

  const drawSign = (ctx: CanvasRenderingContext2D, parallaxX: number, parallaxY: number) => {
      const x = CANVAS_WIDTH / 2 - parallaxX;
      const y = 150 - parallaxY;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;

      // Plaque Border
      ctx.fillStyle = '#8d6e63'; // Wood border
      ctx.fillRect(x - 210, y - 50, 420, 100);
      
      // Plaque Inner
      ctx.fillStyle = '#3e2723'; // Dark wood
      ctx.fillRect(x - 200, y - 40, 400, 80);
      
      // Gold Trim
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 205, y - 45, 410, 90);

      // Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.font = 'bold 24px "Playfair Display"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("THE FELDMAN LAW FIRM LLP", x, y - 10);
      
      ctx.font = 'italic 14px "Playfair Display"';
      ctx.fillStyle = '#D7CCC8'; 
      ctx.fillText("Est. 1984 • Justice Served Hot", x, y + 20);

      ctx.restore();
  };

  const createExplosion = (x: number, y: number, scale: number) => {
    // Feathers
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: Math.random() > 0.5 ? '#4E342E' : '#D32F2F', // Brown and Red
      });
    }
    // White Papers (Legal Briefs)
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 5, // Tend to fly up
        life: 1.5,
        color: '#FFFFFF',
      });
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((p, index) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      
      if (p.color === '#FFFFFF') {
        // Draw paper fluttering
        ctx.rotate(p.life * 10);
        ctx.fillRect(-5, -7, 10, 14);
        // Text lines
        ctx.fillStyle = '#999';
        ctx.fillRect(-3, -4, 6, 1);
        ctx.fillRect(-3, -1, 6, 1);
        ctx.fillRect(-3, 2, 6, 1);
      } else {
        // Draw feather
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // Gravity
      p.life -= 0.02;

      if (p.life <= 0) {
        particlesRef.current.splice(index, 1);
      }
      ctx.globalAlpha = 1.0;
    });
  };

  // Main Loop
  const animate = useCallback((time: number) => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const parallaxX = (mousePosRef.current.x - CANVAS_WIDTH/2) * 0.03;
    const parallaxY = (mousePosRef.current.y - CANVAS_HEIGHT/2) * 0.03;

    // Draw Background
    if (bgImageRef.current) {
        // Draw slightly larger to account for parallax movement
        ctx.drawImage(bgImageRef.current, 
            -50 - parallaxX, 
            -50 - parallaxY, 
            CANVAS_WIDTH + 100, 
            CANVAS_HEIGHT + 100
        );
    } else {
        ctx.fillStyle = '#263238';
        ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw The Sign (Behind turkeys, but after bg)
    drawSign(ctx, parallaxX, parallaxY);

    // Vignette
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 400, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 900);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Spawn
    if (time - lastSpawnTimeRef.current > 1000) {
        spawnTurkey();
        lastSpawnTimeRef.current = time;
    }

    // Update & Draw Turkeys (Sorted by scale for depth - smaller (further) first)
    turkeysRef.current.sort((a, b) => a.scale - b.scale);

    turkeysRef.current.forEach((turkey, index) => {
      if (turkey.state === 'RUNNING') {
        turkey.x += turkey.speedX;
        turkey.y += turkey.speedY;
        
        // Remove if out of bounds
        if (turkey.x < -200 || turkey.x > CANVAS_WIDTH + 200) {
           turkeysRef.current.splice(index, 1);
           return;
        }
      } else if (turkey.state === 'HIT') {
          turkey.deathTimer += 1;
          turkey.scale *= 0.9;
          turkey.y += 4; 
          if (turkey.deathTimer > 10) {
              turkeysRef.current.splice(index, 1);
              return;
          }
      }

      drawTurkey(ctx, turkey, time);
    });

    drawParticles(ctx);

    // First Person Crosshair
    const mx = mousePosRef.current.x;
    const my = mousePosRef.current.y;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, 25, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair notches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(mx - 35, my);
    ctx.lineTo(mx - 15, my);
    ctx.moveTo(mx + 15, my);
    ctx.lineTo(mx + 35, my);
    ctx.moveTo(mx, my - 35);
    ctx.lineTo(mx, my - 15);
    ctx.moveTo(mx, my + 15);
    ctx.lineTo(mx, my + 35);
    ctx.stroke();

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, spawnTurkey]);

  const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if(rect) {
          mousePosRef.current = {
              x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
              y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
          };
      }
  };

  const handleClick = async () => {
      if (gameState !== GameState.PLAYING) return;

      audioService.playShoot();

      const mx = mousePosRef.current.x;
      const my = mousePosRef.current.y;

      // Reverse iterate to hit closest turkeys first
      for (let i = turkeysRef.current.length - 1; i >= 0; i--) {
          const t = turkeysRef.current[i];
          if (t.state !== 'RUNNING') continue;

          // Hitbox approximation (Elliptical)
          // The graphic is roughly 70px wide, 60px tall at scale 1
          const w = 50 * t.scale;
          const h = 45 * t.scale;
          
          // Calculate distance from mouse to turkey center
          // Note: drawTurkey translates to t.x, t.y
          // Center of body is roughly 0,0 relative to t.x, t.y
          const dx = mx - t.x;
          const dy = my - t.y;

          // Ellipse collision check equation: (x^2/a^2) + (y^2/b^2) <= 1
          if ((dx*dx)/(w*w) + (dy*dy)/(h*h) <= 1.2) { // 1.2 leeway
              // HIT!
              t.state = 'HIT';
              createExplosion(t.x, t.y, t.scale);
              setScore(s => s + Math.round(100 * (1 + (1 - t.scale)))); // Bonus for small targets
              
              // Chance to gobble in pain
              audioService.playGobble();

              // 40% chance for advice
              if (Math.random() > 0.6) {
                const advice = await getTurkeyLegalAdvice();
                setLastAdvice(advice);
              }

              break; // Single shot single kill
          }
      }
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        requestRef.current = requestAnimationFrame(animate);
    } else {
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
        if(gameState === GameState.MENU) {
            turkeysRef.current = [];
            particlesRef.current = [];
        }
    }
    return () => {
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={`w-full h-full object-cover ${gameState === GameState.PLAYING ? 'cursor-none' : 'cursor-default'}`}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    />
  );
};

export default GameCanvas;
