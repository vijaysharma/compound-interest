/**
 * Navigation feedback for the window between first paint and hydration.
 *
 * The server HTML is visible ~1s+ before React hydrates on a mid-range phone (the shell bundle is
 * mostly react-dom + the Next runtime, so it can't be trimmed away). A link tapped in that window
 * triggers a full document load with no in-app feedback, so the app looks frozen. This inline
 * script runs before any bundle and marks <html> on press of an internal link, which shows a
 * CSS-only bar (`html[data-nav-intent]` in _base.scss). Like the hydrated Link it reacts on
 * pointerdown; a press that turns into a scroll/drag (pointercancel, or released off the link)
 * clears it, a click commits it. NavigationProgressBar sets `window.__navHydrated` on mount and
 * takes over any intent still showing.
 *
 * The mobile menu button is the way into navigation on small screens, but the drawer only exists
 * once React renders it, so a pre-hydration tap was silently lost. It is recorded instead
 * (`html[data-menu-intent]`, shown as a pressed button) and TopBar opens the drawer on mount.
 *
 * Kept dependency-free and ES5-safe: it is inlined verbatim into <head>.
 */
export const NAV_INTENT_ATTR = 'data-nav-intent';
export const MENU_INTENT_ATTR = 'data-menu-intent';
export const PREHYDRATION_NAV_SCRIPT = `(function(){
var d=document.documentElement,A='${NAV_INTENT_ATTR}',pressed=null,committed=false;
function link(e){
if(window.__navHydrated||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return null;
var a=e.target&&e.target.closest&&e.target.closest('a[href]');
if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download'))return null;
var u=new URL(a.href,location.href);
if(u.origin!==location.origin||(u.pathname===location.pathname&&u.search===location.search))return null;
return a;
}
function release(){if(pressed&&!committed)d.removeAttribute(A);pressed=null;}
addEventListener('pointerdown',function(e){pressed=e.isPrimary?link(e):null;if(pressed)d.setAttribute(A,'');},true);
addEventListener('pointerup',function(e){if(pressed&&pressed.contains(e.target))pressed=null;else release();},true);
addEventListener('pointercancel',release,true);
addEventListener('click',function(e){
if(!window.__navHydrated&&e.target.closest&&e.target.closest('[aria-controls="navigation-drawer"]')){d.setAttribute('${MENU_INTENT_ATTR}','');return;}
if(link(e)){committed=true;d.setAttribute(A,'');}
},true);
addEventListener('pageshow',function(){committed=false;pressed=null;d.removeAttribute(A);});
})();`;
