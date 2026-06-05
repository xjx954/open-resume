const iconAttrs = `class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"`;

const svg = {
  email: `<svg ${iconAttrs}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  phone: `<svg ${iconAttrs}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.8a2 2 0 0 1-.45 2.11L8.05 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.31 1.84.53 2.8.66A2 2 0 0 1 22 16.92Z"/></svg>`,
  github: `<svg ${iconAttrs}><path d="M15 22v-3.5a3.4 3.4 0 0 0-1-2.65c3.3-.37 6.75-1.62 6.75-7.25a5.6 5.6 0 0 0-1.5-3.9 5.2 5.2 0 0 0-.1-3.85s-1.22-.39-4 1.5a13.7 13.7 0 0 0-7.3 0c-2.78-1.89-4-1.5-4-1.5a5.2 5.2 0 0 0-.1 3.85 5.6 5.6 0 0 0-1.5 3.9c0 5.62 3.43 6.88 6.72 7.25A3 3 0 0 0 8 18.1V22"/><path d="M8 19c-3 .9-5-1.1-6-3"/></svg>`,
  blog: `<svg ${iconAttrs}><path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5Z"/><path d="M8 7h7"/><path d="M8 11h7"/><path d="M8 15h4"/></svg>`,
  website: `<svg ${iconAttrs}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/></svg>`,
  linkedin: `<svg ${iconAttrs}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z"/><path d="M2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>`,
  weixin: `<svg ${iconAttrs}><path d="M9.5 15.5c-3.6 0-6.5-2.3-6.5-5.2S5.9 5 9.5 5s6.5 2.3 6.5 5.2-2.9 5.3-6.5 5.3Z"/><path d="M14.5 12.5c3.6 0 6.5 2.2 6.5 5 0 1.1-.45 2.1-1.2 2.9l.55 1.6-2.15-.9c-1 .35-2.25.55-3.7.55-2.5 0-4.7-1.1-5.8-2.7"/><path d="M7.5 9h.01"/><path d="M11.5 9h.01"/><path d="M13.5 16.5h.01"/><path d="M17.5 16.5h.01"/></svg>`,
  juejin: `<svg ${iconAttrs}><path d="m4 8 8-5 8 5-8 5-8-5Z"/><path d="m4 13 8 5 8-5"/><path d="m4 17 8 5 8-5"/></svg>`,
  yuque: `<svg ${iconAttrs}><path d="M5 4h14v16H5z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>`,
  sifou: `<svg ${iconAttrs}><path d="M5 19h14"/><path d="M7 15h10"/><path d="M9 11h6"/><path d="M11 7h2"/></svg>`,
  zhihu: `<svg ${iconAttrs}><path d="M4 6h7"/><path d="M5 12h6"/><path d="M8 6c0 6-1.5 10-4 13"/><path d="M9.5 12c.7 2.6 1.9 4.7 3.5 6"/><path d="M14 5h6v12h-6z"/><path d="m15 20 3-3"/></svg>`,
  weibo: `<svg ${iconAttrs}><path d="M4 14c0-3 3.2-5.5 7.2-5.5 4.2 0 7.8 2.3 7.8 5.5S15.6 20 11.2 20 4 17.3 4 14Z"/><path d="M16.5 5.5c2.2.3 3.9 1.9 4.2 4.1"/><path d="M15.5 8.5c1 .2 1.8.9 2 1.9"/><path d="M8.5 15.5h.01"/><path d="M13 14.5h.01"/></svg>`,
  qq: `<svg ${iconAttrs}><path d="M12 3c-3 0-5 2.7-5 6.2 0 1.9-.7 3.3-1.5 4.5-.8 1.2-1.5 2.2-1.5 3.3 0 1.6 1.5 2.4 3.2 1.7.8 1.5 2.5 2.3 4.8 2.3s4-.8 4.8-2.3c1.7.7 3.2-.1 3.2-1.7 0-1.1-.7-2.1-1.5-3.3-.8-1.2-1.5-2.6-1.5-4.5C17 5.7 15 3 12 3Z"/><path d="M10 9h.01"/><path d="M14 9h.01"/></svg>`,
  twitter: `<svg ${iconAttrs}><path d="M22 5.8c-.8.4-1.6.6-2.5.8a4.1 4.1 0 0 0-7 3.7A11.7 11.7 0 0 1 4 6s-4 9 5 13a12 12 0 0 1-7 2c9 5 20 0 20-11.5v-.5c.8-.6 1.5-1.3 2-2.2Z"/></svg>`,
  facebook: `<svg ${iconAttrs}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  csdn: `<svg ${iconAttrs}><path d="M19 7c-1.4-1-3.2-1.5-5.4-1.5C8.4 5.5 5 8.1 5 12s3.4 6.5 8.6 6.5c2.2 0 4-.5 5.4-1.5"/><path d="M16 10h-3a2 2 0 0 0 0 4h3"/></svg>`,
};

type Svg = typeof svg;

export type SvgType = keyof Svg;

export default svg;
