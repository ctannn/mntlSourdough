import React from 'react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';

/**
 * Image-led MNTL hero. A clean product-first layout rather than a generic
 * editorial/AI-ad template. The bread photograph receives the full right
 * side; headline and CTAs remain readable without text painted over food.
 */
export function Hero({image, onShop, onStory}) {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-content">
        <div className="hero-kicker"><span aria-hidden="true" className="hero-kicker-dot" />
          MNTL SOURDOUGH <span className="hero-kicker-slash">/</span> CALGARY, AB
        </div>
        <h1 id="hero-heading">
          <span>IT'S JUST</span>
          <span>BREAD.</span>
          <span className="hero-heading-bottom">UNTIL IT ISN'T.</span>
        </h1>
        <p>Slow fermented. Crackly crust. Made with an unreasonable amount of care.</p>
        <div className="hero-actions">
          <button className="hero-button" type="button" onClick={onShop}>
            SHOP THE LOAVES <ArrowUpRight size={18} />
          </button>
          <button className="hero-text-link" type="button" onClick={onStory}>
            GET TO KNOW MNTL <ArrowRight size={17} />
          </button>
        </div>
        <div className="hero-signature">
          <span><b>01</b> NATURALLY FERMENTED</span>
          <span><b>02</b> SMALL BATCH</span>
          <span><b>03</b> NEVER RUSHED</span>
        </div>
      </div>
      <div className="hero-visual">
        <img src={image} alt="Rustic, golden-crusted artisan sourdough bread"
             fetchPriority="high" decoding="async"/>
        <span className="hero-visual-label">MADE SLOWLY. GONE QUICKLY.</span>
        <span className="hero-photo-index" aria-hidden="true">MNTL / 001</span>
      </div>
    </section>
  );
}
