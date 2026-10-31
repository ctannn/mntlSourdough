import React from 'react';
import {safeStoryLink} from '../lib/ovenJournal.mjs';

// Purposefully small Markdown-like renderer. It does NOT interpret HTML or
// dangerouslySetInnerHTML. Editors can write headings, lists, **bold** and
// [links](https://example.com); everything else is plain escaped text.
function inlinePieces(input) {
  const tokens = [];
  const regex = /(\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\))/g;
  let index = 0, match;
  while ((match = regex.exec(input)) !== null) {
    if (match.index > index) tokens.push(input.slice(index,match.index));
    if (match[2]) tokens.push(<strong key={'strong-'+match.index}>{match[2]}</strong>);
    else {
      const href = safeStoryLink(match[4]);
      tokens.push(href
        ? <a key={'link-'+match.index} href={href} rel="noopener noreferrer" target="_blank">{match[3]}</a>
        : match[0]);
    }
    index = match.index + match[0].length;
  }
  if (index < input.length) tokens.push(input.slice(index));
  return tokens;
}
export function StoryBody({body = ''}) {
  const blocks = String(body).replace(/\r\n?/g,'\n').split(/\n\s*\n/).filter(Boolean);
  return <div className="oven-story-body">
    {blocks.map((block, idx) => {
      const lines = block.trim().split('\n');
      const heading = lines.length === 1 ? lines[0].match(/^(#{1,3})\s+(.+)$/) : null;
      if (heading) {
        if (heading[1].length === 1) return <h2 key={idx}>{inlinePieces(heading[2])}</h2>;
        return <h3 key={idx}>{inlinePieces(heading[2])}</h3>;
      }
      if (lines.every(line => /^[-*]\s+/.test(line))) {
        return <ul key={idx}>{lines.map((line,j)=><li key={j}>{inlinePieces(line.replace(/^[-*]\s+/,''))}</li>)}</ul>;
      }
      return <p key={idx}>{lines.map((line,j)=><React.Fragment key={j}>{j>0?' ':null}{inlinePieces(line)}</React.Fragment>)}</p>;
    })}
  </div>;
}
