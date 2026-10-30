import React from 'react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';

/**
 * Primary storefront hero.
 * The artwork is a locally hosted brand concept (public/images/original.webp).
 * Copy is intentionally understated: warmth, craft and one clear shopping CTA.
 */
export function Hero({image, onShop, onStory}) {
  const backgroundImage =
    "linear-gradient(90deg, rgba(31,23,19,.88) 0%, rgba(31,23,19,.60) 35%, rgba(31,23,19,.03) 76%), url('" +
    image +
    "')";

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div
        className="hero-photo"
        style={{backgroundImage}}
        role="img"
        aria-label="Golden artisan sourdough loaf resting on linen in a warmly lit bakery"
      />
      <div className="hero-content">
        <div className="eyebrow light">
          <span className="hero-small-star" aria-hidden="true">✳</span>
          CALGARY SOURDOUGH / MADE SLOWLY
        </div>
        <h1 id="hero-heading">
          It's just
          <br />
          bread.
          <br />
          <em>Until it isn't.</em>
        </h1>
        <p>
          Long fermentation. Golden crusts. The kind of bread you plan your
          morning around.
        </p>
        <div className="hero-actions">
          <button className="btn cream" type="button" onClick={onShop}>
            Meet your next loaf <ArrowUpRight size={19} />
          </button>
          <button className="hero-secondary" type="button" onClick={onStory}>
            Our story <ArrowRight size={17} />
          </button>
        </div>
        <div className="hero-signature" aria-label="Our bakery values">
          <span>01 <i aria-hidden="true" /> REAL INGREDIENTS</span>
          <span>02 <i aria-hidden="true" /> SLOW FERMENTATION</span>
          <span>03 <i aria-hidden="true" /> SMALL-BATCH BAKING</span>
        </div>
      </div>
      <div className="hero-bottom">
        <span>GOOD BREAD. QUESTIONABLE OBSESSION.</span>
        <span>SCROLL TO EXPLORE ↓</span>
      </div>
    </section>
  );
}
