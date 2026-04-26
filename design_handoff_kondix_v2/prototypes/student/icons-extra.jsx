// Iconos adicionales para la vista alumno. Se fusionan sobre window.Icon existente.
// Uso: <Icon name="home" />

(function() {
  const ICONS = {
    home: <><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></>,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    ruler: <path d="M21.3 8.7 8.7 21.3a2.41 2.41 0 0 1-3.4 0l-2.6-2.6a2.41 2.41 0 0 1 0-3.4L15.3 2.7a2.41 2.41 0 0 1 3.4 0l2.6 2.6a2.41 2.41 0 0 1 0 3.4zM7.5 12.5l2 2M11 9l2 2M14.5 5.5l2 2M4 16l2 2"/>,
    camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
    pause: <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    circleCheck: <><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></>,
    chevronsRight: <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>,
    bicep: <path d="M17.5 3c-1.38 0-2.5 1.12-2.5 2.5V9H9.5a3.5 3.5 0 1 0 0 7H11v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3.5a5.5 5.5 0 0 0 1-10.5V5.5A2.5 2.5 0 0 0 17.5 3z"/>,
    logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    infoCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    checkCircle: <><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></>,
    vibrate: <><path d="M2 8v8"/><path d="M22 8v8"/><path d="M7 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2"/><path d="M17 5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><rect x="9" y="3" width="6" height="18" rx="1"/></>,
    weight: <><circle cx="12" cy="7" r="3"/><path d="M6 21 8 10h8l2 11z"/></>,
    book2: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    messageCircle: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>,
    fire: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
    playCircle: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></>,
    arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>,
    arrowDownRight: <><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></>,
    rotateCw: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
    rotateCcw: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>,
    alarmClock: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="m5 3-2 2"/><path d="m19 3 2 2"/></>,
    moreHorizontal: <><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><circle cx="5" cy="12" r="1.2"/></>,
  };

  // Extend existing Icon component
  const originalIcon = window.Icon;
  window.Icon = function({ name, size = 16, strokeWidth = 1.75, style, ...props }) {
    const paths = ICONS[name];
    if (paths) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, display: 'block', ...style }} {...props}>
          {paths}
        </svg>
      );
    }
    return originalIcon ? originalIcon({ name, size, strokeWidth, style, ...props }) : null;
  };
})();
