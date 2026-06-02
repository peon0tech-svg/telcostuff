import React from 'react';

export const MicrowaveLinkDrawing: React.FC = () => {
  return (
    <svg className="technical-drawing" viewBox="0 0 500 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
        </pattern>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background Grid */}
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Blueprint Border */}
      <rect x="5" y="5" width="490" height="240" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.4" strokeDasharray="5,5" />
      
      {/* Title */}
      <text x="20" y="25" fill="var(--accent)" fontFamily="monospace" fontSize="10" letterSpacing="1" filter="url(#glow)">
        SCHEMATIC: MICROWAVE POINT-TO-POINT LINK // RF_LINK_v3.9
      </text>
      
      {/* Left Tower */}
      <g transform="translate(60, 40)">
        {/* Tower Base & Lattice */}
        <line x1="20" y1="160" x2="35" y2="30" stroke="var(--text-h)" strokeWidth="1.5" />
        <line x1="50" y1="160" x2="35" y2="30" stroke="var(--text-h)" strokeWidth="1.5" />
        <line x1="20" y1="160" x2="50" y2="160" stroke="var(--text-h)" strokeWidth="1.5" />
        {/* Cross braces */}
        <line x1="23" y1="130" x2="47" y2="130" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="26" y1="100" x2="44" y2="100" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="30" y1="70" x2="40" y2="70" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="20" y1="160" x2="47" y2="130" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="50" y1="160" x2="23" y2="130" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="23" y1="130" x2="44" y2="100" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="47" y1="130" x2="26" y2="100" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="26" y1="100" x2="40" y2="70" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="44" y1="100" x2="30" y2="70" stroke="var(--text)" strokeWidth="0.8" />
        
        {/* Antenna Dish */}
        <path d="M 35 30 M 35 45 C 45 45, 52 35, 52 25 C 52 15, 45 5, 35 5 L 35 45 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5" filter="url(#glow)" />
        <line x1="35" y1="25" x2="57" y2="25" stroke="var(--accent)" strokeWidth="1.5" />
        {/* Antenna Feed */}
        <circle cx="57" cy="25" r="2" fill="var(--accent)" />
        
        {/* Ground Symbol */}
        <line x1="10" y1="165" x2="60" y2="165" stroke="var(--text)" strokeWidth="1" />
        <line x1="20" y1="170" x2="50" y2="170" stroke="var(--text)" strokeWidth="1" />
        <line x1="30" y1="175" x2="40" y2="175" stroke="var(--text)" strokeWidth="1" />
        
        <text x="0" y="195" fill="var(--text)" fontFamily="monospace" fontSize="8">TX TOWER [WINDHOEK_A]</text>
      </g>
      
      {/* Transmission Waves */}
      <g stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.8" filter="url(#glow)" strokeDasharray="3,6">
        <path d="M 125 65 Q 250 40, 375 65" />
        <path d="M 125 65 Q 250 80, 375 65" />
      </g>
      
      {/* Wave propagation vectors */}
      <g transform="translate(180, 20)">
        <line x1="10" y1="35" x2="130" y2="35" stroke="var(--text)" strokeWidth="0.8" strokeDasharray="3,3" />
        <polygon points="130,32 136,35 130,38" fill="var(--text)" />
        <text x="45" y="28" fill="var(--accent)" fontFamily="monospace" fontSize="8" letterSpacing="0.5">LINE OF SIGHT (LoS)</text>
        <text x="35" y="48" fill="var(--text)" fontFamily="monospace" fontSize="8">f = 7.5 GHz // D = 42.1 km</text>
      </g>
      
      {/* Right Tower */}
      <g transform="translate(370, 40)">
        {/* Tower Base & Lattice */}
        <line x1="20" y1="160" x2="35" y2="30" stroke="var(--text-h)" strokeWidth="1.5" />
        <line x1="50" y1="160" x2="35" y2="30" stroke="var(--text-h)" strokeWidth="1.5" />
        <line x1="20" y1="160" x2="50" y2="160" stroke="var(--text-h)" strokeWidth="1.5" />
        {/* Cross braces */}
        <line x1="23" y1="130" x2="47" y2="130" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="26" y1="100" x2="44" y2="100" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="30" y1="70" x2="40" y2="70" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="20" y1="160" x2="47" y2="130" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="50" y1="160" x2="23" y2="130" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="23" y1="130" x2="44" y2="100" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="47" y1="130" x2="26" y2="100" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="26" y1="100" x2="40" y2="70" stroke="var(--text)" strokeWidth="0.8" />
        <line x1="44" y1="100" x2="30" y2="70" stroke="var(--text)" strokeWidth="0.8" />
        
        {/* Antenna Dish (Facing Left) */}
        <path d="M 35 30 M 35 45 C 25 45, 18 35, 18 25 C 18 15, 25 5, 35 5 L 35 45 Z" fill="none" stroke="var(--accent)" strokeWidth="1.5" filter="url(#glow)" />
        <line x1="35" y1="25" x2="13" y2="25" stroke="var(--accent)" strokeWidth="1.5" />
        {/* Antenna Feed */}
        <circle cx="13" cy="25" r="2" fill="var(--accent)" />
        
        {/* Ground Symbol */}
        <line x1="10" y1="165" x2="60" y2="165" stroke="var(--text)" strokeWidth="1" />
        <line x1="20" y1="170" x2="50" y2="170" stroke="var(--text)" strokeWidth="1" />
        <line x1="30" y1="175" x2="40" y2="175" stroke="var(--text)" strokeWidth="1" />
        
        <text x="-5" y="195" fill="var(--text)" fontFamily="monospace" fontSize="8">RX TOWER [OKAHANDJA_B]</text>
      </g>
      
      {/* Insets / Tech Specs Box */}
      <g transform="translate(180, 130)">
        <rect x="0" y="0" width="140" height="60" fill="var(--code-bg)" stroke="var(--border)" strokeWidth="1" />
        <text x="10" y="15" fill="var(--text-h)" fontFamily="monospace" fontSize="8" fontWeight="bold">LINK PERFORMANCE</text>
        <text x="10" y="28" fill="var(--text)" fontFamily="monospace" fontSize="7">ATTENUATION: -62.4 dB</text>
        <text x="10" y="38" fill="var(--text)" fontFamily="monospace" fontSize="7">RX_LEVEL: -51.8 dBm [PASS]</text>
        <text x="10" y="48" fill="var(--accent)" fontFamily="monospace" fontSize="7">AVAILABILITY: 99.999%</text>
      </g>
    </svg>
  );
};

export const SpectrumAllocationDrawing: React.FC = () => {
  return (
    <svg className="technical-drawing" viewBox="0 0 500 250" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
        </pattern>
        <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="spectrumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      
      {/* Background Grid */}
      <rect width="100%" height="100%" fill="url(#grid2)" />
      
      {/* Border */}
      <rect x="5" y="5" width="490" height="240" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.4" strokeDasharray="5,5" />
      
      {/* Title */}
      <text x="20" y="25" fill="var(--accent)" fontFamily="monospace" fontSize="10" letterSpacing="1" filter="url(#glow2)">
        SPECTRUM ALLOCATION SCHEMA // CRAN_NAMIBIA_BANDPLAN
      </text>
      
      {/* Frequency Axis */}
      <line x1="40" y1="180" x2="460" y2="180" stroke="var(--text-h)" strokeWidth="2" />
      <polygon points="460,177 466,180 460,183" fill="var(--text-h)" />
      <text x="440" y="195" fill="var(--text-h)" fontFamily="monospace" fontSize="8" fontWeight="bold">FREQ (MHz)</text>
      
      {/* Frequency Ticks */}
      <g stroke="var(--text-h)" strokeWidth="1" fill="var(--text)" fontFamily="monospace" fontSize="8">
        <line x1="50" y1="180" x2="50" y2="185" />
        <text x="42" y="195">790</text>
        
        <line x1="120" y1="180" x2="120" y2="185" />
        <text x="112" y="195">862</text>
        
        <line x1="210" y1="180" x2="210" y2="185" />
        <text x="200" y="195">1800</text>
        
        <line x1="300" y1="180" x2="300" y2="185" />
        <text x="290" y="195">2100</text>
        
        <line x1="410" y1="180" x2="410" y2="185" />
        <text x="400" y="195">2600</text>
      </g>
      
      {/* Channel blocks */}
      {/* Band 20 (LTE 800) */}
      <g transform="translate(50, 90)">
        <rect x="0" y="0" width="70" height="60" fill="url(#spectrumGrad)" stroke="var(--accent)" strokeWidth="1.5" filter="url(#glow2)" />
        <text x="10" y="25" fill="var(--accent)" fontFamily="monospace" fontSize="9" fontWeight="bold">LTE B20</text>
        <text x="10" y="38" fill="var(--text)" fontFamily="monospace" fontSize="7">DD_800 MHz</text>
        <text x="10" y="48" fill="var(--text)" fontFamily="monospace" fontSize="7">2x10 MHz FDD</text>
      </g>
      
      {/* Guard Band */}
      <g transform="translate(120, 110)">
        <rect x="0" y="0" width="20" height="40" fill="none" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2,2" />
        <text x="5" y="25" fill="var(--text)" fontFamily="monospace" fontSize="6" writingMode="tb" glyphOrientationVertical="0">GUARD</text>
      </g>
      
      {/* Band 3 (LTE 1800) */}
      <g transform="translate(210, 70)">
        <rect x="0" y="0" width="80" height="80" fill="url(#spectrumGrad)" stroke="var(--accent)" strokeWidth="1.5" filter="url(#glow2)" />
        <text x="10" y="30" fill="var(--accent)" fontFamily="monospace" fontSize="9" fontWeight="bold">LTE B3</text>
        <text x="10" y="45" fill="var(--text)" fontFamily="monospace" fontSize="7">DCS_1800 MHz</text>
        <text x="10" y="58" fill="var(--text)" fontFamily="monospace" fontSize="7">2x20 MHz FDD</text>
        <text x="10" y="68" fill="var(--text)" fontFamily="monospace" fontSize="6" opacity="0.7">ALLOC: MTC / TN</text>
      </g>
      
      {/* Band 1 (UMTS/LTE 2100) */}
      <g transform="translate(300, 90)">
        <rect x="0" y="0" width="60" height="60" fill="url(#spectrumGrad)" stroke="var(--accent)" strokeWidth="1.5" filter="url(#glow2)" />
        <text x="8" y="25" fill="var(--accent)" fontFamily="monospace" fontSize="9" fontWeight="bold">IMT_2100</text>
        <text x="8" y="38" fill="var(--text)" fontFamily="monospace" fontSize="7">B1 FDD</text>
        <text x="8" y="48" fill="var(--text)" fontFamily="monospace" fontSize="7">2x15 MHz</text>
      </g>
      
      {/* Carrier signal curves */}
      <path d="M 50 180 C 65 110, 105 110, 120 180" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" strokeDasharray="3,3" />
      <circle cx="85" cy="145" r="2" fill="var(--accent)" />
      
      <path d="M 210 180 C 230 80, 270 80, 290 180" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6" strokeDasharray="3,3" />
      <circle cx="250" cy="130" r="2" fill="var(--accent)" />
      
      {/* Fourier Transform / Spectral Formula Box */}
      <g transform="translate(370, 25)">
        <text x="10" y="15" fill="var(--text)" fontFamily="monospace" fontSize="6">Fft Spectrum Formula</text>
        <text x="10" y="28" fill="var(--accent)" fontFamily="monospace" fontSize="7" fontWeight="bold">S(f) = ∫ s(t)·e^(-j2πft) dt</text>
        <text x="10" y="38" fill="var(--text)" fontFamily="monospace" fontSize="6">RBW = 100 kHz</text>
        <text x="10" y="48" fill="var(--text)" fontFamily="monospace" fontSize="6">DETECTOR: RMS AVERAGE</text>
      </g>
    </svg>
  );
};
