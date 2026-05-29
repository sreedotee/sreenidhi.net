var Ut=Object.defineProperty;var Xt=(t,e,i)=>e in t?Ut(t,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):t[e]=i;var c=(t,e,i)=>Xt(t,typeof e!="symbol"?e+"":e,i);var Mt="1.3.23";function kt(t,e,i){return Math.max(t,Math.min(e,i))}function Yt(t,e,i){return(1-i)*t+i*e}function Vt(t,e,i,s){return Yt(t,e,1-Math.exp(-i*s))}function jt(t,e){return(t%e+e)%e}var Gt=class{constructor(){c(this,"isRunning",!1);c(this,"value",0);c(this,"from",0);c(this,"to",0);c(this,"currentTime",0);c(this,"lerp");c(this,"duration");c(this,"easing");c(this,"onUpdate")}advance(t){var i;if(!this.isRunning)return;let e=!1;if(this.duration&&this.easing){this.currentTime+=t;const s=kt(0,this.currentTime/this.duration,1);e=s>=1;const o=e?1:this.easing(s);this.value=this.from+(this.to-this.from)*o}else this.lerp?(this.value=Vt(this.value,this.to,this.lerp*60,t),Math.round(this.value)===Math.round(this.to)&&(this.value=this.to,e=!0)):(this.value=this.to,e=!0);e&&this.stop(),(i=this.onUpdate)==null||i.call(this,this.value,e)}stop(){this.isRunning=!1}fromTo(t,e,{lerp:i,duration:s,easing:o,onStart:r,onUpdate:a}){this.from=this.value=t,this.to=e,this.lerp=i,this.duration=s,this.easing=o,this.currentTime=0,this.isRunning=!0,r==null||r(),this.onUpdate=a}};function $t(t,e){let i;return function(...s){clearTimeout(i),i=setTimeout(()=>{i=void 0,t.apply(this,s)},e)}}var Kt=class{constructor(t,e,{autoResize:i=!0,debounce:s=250}={}){c(this,"width",0);c(this,"height",0);c(this,"scrollHeight",0);c(this,"scrollWidth",0);c(this,"debouncedResize");c(this,"wrapperResizeObserver");c(this,"contentResizeObserver");c(this,"resize",()=>{this.onWrapperResize(),this.onContentResize()});c(this,"onWrapperResize",()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)});c(this,"onContentResize",()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)});this.wrapper=t,this.content=e,i&&(this.debouncedResize=$t(this.resize,s),this.wrapper instanceof Window?window.addEventListener("resize",this.debouncedResize):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}destroy(){var t,e;(t=this.wrapperResizeObserver)==null||t.disconnect(),(e=this.contentResizeObserver)==null||e.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener("resize",this.debouncedResize)}get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}},It=class{constructor(){c(this,"events",{})}emit(t,...e){var s;const i=this.events[t]||[];for(let o=0,r=i.length;o<r;o++)(s=i[o])==null||s.call(i,...e)}on(t,e){return this.events[t]?this.events[t].push(e):this.events[t]=[e],()=>{var i;this.events[t]=(i=this.events[t])==null?void 0:i.filter(s=>e!==s)}}off(t,e){var i;this.events[t]=(i=this.events[t])==null?void 0:i.filter(s=>e!==s)}destroy(){this.events={}}};const Jt=100/6,$={passive:!1};function Et(t,e){return t===1?Jt:t===2?e:1}var Qt=class{constructor(t,e={wheelMultiplier:1,touchMultiplier:1}){c(this,"touchStart",{x:0,y:0});c(this,"lastDelta",{x:0,y:0});c(this,"window",{width:0,height:0});c(this,"emitter",new It);c(this,"onTouchStart",t=>{const{clientX:e,clientY:i}=t.targetTouches?t.targetTouches[0]:t;this.touchStart.x=e,this.touchStart.y=i,this.lastDelta={x:0,y:0},this.emitter.emit("scroll",{deltaX:0,deltaY:0,event:t})});c(this,"onTouchMove",t=>{const{clientX:e,clientY:i}=t.targetTouches?t.targetTouches[0]:t,s=-(e-this.touchStart.x)*this.options.touchMultiplier,o=-(i-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=e,this.touchStart.y=i,this.lastDelta={x:s,y:o},this.emitter.emit("scroll",{deltaX:s,deltaY:o,event:t})});c(this,"onTouchEnd",t=>{this.emitter.emit("scroll",{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:t})});c(this,"onWheel",t=>{let{deltaX:e,deltaY:i,deltaMode:s}=t;const o=Et(s,this.window.width),r=Et(s,this.window.height);e*=o,i*=r,e*=this.options.wheelMultiplier,i*=this.options.wheelMultiplier,this.emitter.emit("scroll",{deltaX:e,deltaY:i,event:t})});c(this,"onWindowResize",()=>{this.window={width:window.innerWidth,height:window.innerHeight}});this.element=t,this.options=e,window.addEventListener("resize",this.onWindowResize),this.onWindowResize(),this.element.addEventListener("wheel",this.onWheel,$),this.element.addEventListener("touchstart",this.onTouchStart,$),this.element.addEventListener("touchmove",this.onTouchMove,$),this.element.addEventListener("touchend",this.onTouchEnd,$)}on(t,e){return this.emitter.on(t,e)}destroy(){this.emitter.destroy(),window.removeEventListener("resize",this.onWindowResize),this.element.removeEventListener("wheel",this.onWheel,$),this.element.removeEventListener("touchstart",this.onTouchStart,$),this.element.removeEventListener("touchmove",this.onTouchMove,$),this.element.removeEventListener("touchend",this.onTouchEnd,$)}};const Lt=t=>Math.min(1,1.001-2**(-10*t));var Zt=class{constructor({wrapper:t=window,content:e=document.documentElement,eventsTarget:i=t,smoothWheel:s=!0,syncTouch:o=!1,syncTouchLerp:r=.075,touchInertiaExponent:a=1.7,duration:u,easing:n,lerp:l=.1,infinite:m=!1,orientation:g="vertical",gestureOrientation:f=g==="horizontal"?"both":"vertical",touchMultiplier:y=1,wheelMultiplier:h=1,autoResize:S=!0,prevent:v,virtualScroll:L,overscroll:O=!0,autoRaf:q=!1,anchors:A=!1,autoToggle:H=!1,allowNestedScroll:B=!1,__experimental__naiveDimensions:J=!1,naiveDimensions:j=J,stopInertiaOnNavigate:it=!1}={}){c(this,"_isScrolling",!1);c(this,"_isStopped",!1);c(this,"_isLocked",!1);c(this,"_preventNextNativeScrollEvent",!1);c(this,"_resetVelocityTimeout",null);c(this,"_rafId",null);c(this,"isTouching");c(this,"time",0);c(this,"userData",{});c(this,"lastVelocity",0);c(this,"velocity",0);c(this,"direction",0);c(this,"options");c(this,"targetScroll");c(this,"animatedScroll");c(this,"animate",new Gt);c(this,"emitter",new It);c(this,"dimensions");c(this,"virtualScroll");c(this,"onScrollEnd",t=>{t instanceof CustomEvent||(this.isScrolling==="smooth"||this.isScrolling===!1)&&t.stopPropagation()});c(this,"dispatchScrollendEvent",()=>{this.options.wrapper.dispatchEvent(new CustomEvent("scrollend",{bubbles:this.options.wrapper===window,detail:{lenisScrollEnd:!0}}))});c(this,"onTransitionEnd",t=>{var e;(e=t.propertyName)!=null&&e.includes("overflow")&&t.target===this.rootElement&&this.checkOverflow()});c(this,"onClick",t=>{const e=t.composedPath().filter(s=>s instanceof HTMLAnchorElement&&s.href).map(s=>new URL(s.href)),i=new URL(window.location.href);if(this.options.anchors){const s=e.find(o=>i.host===o.host&&i.pathname===o.pathname&&o.hash);if(s){const o=typeof this.options.anchors=="object"&&this.options.anchors?this.options.anchors:void 0,r=`#${s.hash.split("#")[1]}`;this.scrollTo(r,o);return}}if(this.options.stopInertiaOnNavigate&&e.some(s=>i.host===s.host&&i.pathname!==s.pathname)){this.reset();return}});c(this,"onPointerDown",t=>{t.button===1&&this.reset()});c(this,"onVirtualScroll",t=>{if(typeof this.options.virtualScroll=="function"&&this.options.virtualScroll(t)===!1)return;const{deltaX:e,deltaY:i,event:s}=t;if(this.emitter.emit("virtual-scroll",{deltaX:e,deltaY:i,event:s}),s.ctrlKey||s.lenisStopPropagation)return;const o=s.type.includes("touch"),r=s.type.includes("wheel");this.isTouching=s.type==="touchstart"||s.type==="touchmove";const a=e===0&&i===0;if(this.options.syncTouch&&o&&s.type==="touchstart"&&a&&!this.isStopped&&!this.isLocked){this.reset();return}const u=this.options.gestureOrientation==="vertical"&&i===0||this.options.gestureOrientation==="horizontal"&&e===0;if(a||u)return;let n=s.composedPath();n=n.slice(0,n.indexOf(this.rootElement));const l=this.options.prevent,m=Math.abs(e)>=Math.abs(i)?"horizontal":"vertical";if(n.find(h=>{var S,v,L,O,q;return h instanceof HTMLElement&&(typeof l=="function"&&(l==null?void 0:l(h))||((S=h.hasAttribute)==null?void 0:S.call(h,"data-lenis-prevent"))||m==="vertical"&&((v=h.hasAttribute)==null?void 0:v.call(h,"data-lenis-prevent-vertical"))||m==="horizontal"&&((L=h.hasAttribute)==null?void 0:L.call(h,"data-lenis-prevent-horizontal"))||o&&((O=h.hasAttribute)==null?void 0:O.call(h,"data-lenis-prevent-touch"))||r&&((q=h.hasAttribute)==null?void 0:q.call(h,"data-lenis-prevent-wheel"))||this.options.allowNestedScroll&&this.hasNestedScroll(h,{deltaX:e,deltaY:i}))}))return;if(this.isStopped||this.isLocked){s.cancelable&&s.preventDefault();return}if(!(this.options.syncTouch&&o||this.options.smoothWheel&&r)){this.isScrolling="native",this.animate.stop(),s.lenisStopPropagation=!0;return}let g=i;this.options.gestureOrientation==="both"?g=Math.abs(i)>Math.abs(e)?i:e:this.options.gestureOrientation==="horizontal"&&(g=e),(!this.options.overscroll||this.options.infinite||this.options.wrapper!==window&&this.limit>0&&(this.animatedScroll>0&&this.animatedScroll<this.limit||this.animatedScroll===0&&i>0||this.animatedScroll===this.limit&&i<0))&&(s.lenisStopPropagation=!0),s.cancelable&&s.preventDefault();const f=o&&this.options.syncTouch,y=o&&s.type==="touchend";y&&(g=Math.sign(g)*Math.abs(this.velocity)**this.options.touchInertiaExponent),this.scrollTo(this.targetScroll+g,{programmatic:!1,...f?{lerp:y?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}})});c(this,"onNativeScroll",()=>{if(this._resetVelocityTimeout!==null&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent){this._preventNextNativeScrollEvent=!1;return}if(this.isScrolling===!1||this.isScrolling==="native"){const t=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-t,this.direction=Math.sign(this.animatedScroll-t),this.isStopped||(this.isScrolling="native"),this.emit(),this.velocity!==0&&(this._resetVelocityTimeout=setTimeout(()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()},400))}});c(this,"raf",t=>{const e=t-(this.time||t);this.time=t,this.animate.advance(e*.001),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))});window.lenisVersion=Mt,window.lenis||(window.lenis={}),window.lenis.version=Mt,g==="horizontal"&&(window.lenis.horizontal=!0),o===!0&&(window.lenis.touch=!0),(!t||t===document.documentElement)&&(t=window),typeof u=="number"&&typeof n!="function"?n=Lt:typeof n=="function"&&typeof u!="number"&&(u=1),this.options={wrapper:t,content:e,eventsTarget:i,smoothWheel:s,syncTouch:o,syncTouchLerp:r,touchInertiaExponent:a,duration:u,easing:n,lerp:l,infinite:m,gestureOrientation:f,orientation:g,touchMultiplier:y,wheelMultiplier:h,autoResize:S,prevent:v,virtualScroll:L,overscroll:O,autoRaf:q,anchors:A,autoToggle:H,allowNestedScroll:B,naiveDimensions:j,stopInertiaOnNavigate:it},this.dimensions=new Kt(t,e,{autoResize:S}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener("scroll",this.onNativeScroll),this.options.wrapper.addEventListener("scrollend",this.onScrollEnd,{capture:!0}),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.addEventListener("click",this.onClick),this.options.wrapper.addEventListener("pointerdown",this.onPointerDown),this.virtualScroll=new Qt(i,{touchMultiplier:y,wheelMultiplier:h}),this.virtualScroll.on("scroll",this.onVirtualScroll),this.options.autoToggle&&(this.checkOverflow(),this.rootElement.addEventListener("transitionend",this.onTransitionEnd)),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener("scroll",this.onNativeScroll),this.options.wrapper.removeEventListener("scrollend",this.onScrollEnd,{capture:!0}),this.options.wrapper.removeEventListener("pointerdown",this.onPointerDown),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.removeEventListener("click",this.onClick),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName(),this._rafId&&cancelAnimationFrame(this._rafId)}on(t,e){return this.emitter.on(t,e)}off(t,e){return this.emitter.off(t,e)}get overflow(){const t=this.isHorizontal?"overflow-x":"overflow-y";return getComputedStyle(this.rootElement)[t]}checkOverflow(){["hidden","clip"].includes(this.overflow)?this.internalStop():this.internalStart()}setScroll(t){this.isHorizontal?this.options.wrapper.scrollTo({left:t,behavior:"instant"}):this.options.wrapper.scrollTo({top:t,behavior:"instant"})}resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit("scroll",this)}reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){if(this.isStopped){if(this.options.autoToggle){this.rootElement.style.removeProperty("overflow");return}this.internalStart()}}internalStart(){this.isStopped&&(this.reset(),this.isStopped=!1,this.emit())}stop(){if(!this.isStopped){if(this.options.autoToggle){this.rootElement.style.setProperty("overflow","clip");return}this.internalStop()}}internalStop(){this.isStopped||(this.reset(),this.isStopped=!0,this.emit())}scrollTo(t,{offset:e=0,immediate:i=!1,lock:s=!1,programmatic:o=!0,lerp:r=o?this.options.lerp:void 0,duration:a=o?this.options.duration:void 0,easing:u=o?this.options.easing:void 0,onStart:n,onComplete:l,force:m=!1,userData:g}={}){if((this.isStopped||this.isLocked)&&!m)return;let f=t,y=e;if(typeof f=="string"&&["top","left","start","#"].includes(f))f=0;else if(typeof f=="string"&&["bottom","right","end"].includes(f))f=this.limit;else{let h=null;if(typeof f=="string"?(h=document.querySelector(f),h||(f==="#top"?f=0:console.warn("Lenis: Target not found",f))):f instanceof HTMLElement&&(f!=null&&f.nodeType)&&(h=f),h){if(this.options.wrapper!==window){const A=this.rootElement.getBoundingClientRect();y-=this.isHorizontal?A.left:A.top}const S=h.getBoundingClientRect(),v=getComputedStyle(h),L=this.isHorizontal?Number.parseFloat(v.scrollMarginLeft):Number.parseFloat(v.scrollMarginTop),O=getComputedStyle(this.rootElement),q=this.isHorizontal?Number.parseFloat(O.scrollPaddingLeft):Number.parseFloat(O.scrollPaddingTop);f=(this.isHorizontal?S.left:S.top)+this.animatedScroll-(Number.isNaN(L)?0:L)-(Number.isNaN(q)?0:q)}}if(typeof f=="number"){if(f+=y,this.options.infinite){if(o){this.targetScroll=this.animatedScroll=this.scroll;const h=f-this.animatedScroll;h>this.limit/2?f-=this.limit:h<-this.limit/2&&(f+=this.limit)}}else f=kt(0,f,this.limit);if(f===this.targetScroll){n==null||n(this),l==null||l(this);return}if(this.userData=g??{},i){this.animatedScroll=this.targetScroll=f,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),l==null||l(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()});return}o||(this.targetScroll=f),typeof a=="number"&&typeof u!="function"?u=Lt:typeof u=="function"&&typeof a!="number"&&(a=1),this.animate.fromTo(this.animatedScroll,f,{duration:a,easing:u,lerp:r,onStart:()=>{s&&(this.isLocked=!0),this.isScrolling="smooth",n==null||n(this)},onUpdate:(h,S)=>{this.isScrolling="smooth",this.lastVelocity=this.velocity,this.velocity=h-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=h,this.setScroll(this.scroll),o&&(this.targetScroll=h),S||this.emit(),S&&(this.reset(),this.emit(),l==null||l(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()}),this.preventNextNativeScrollEvent())}})}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame(()=>{this._preventNextNativeScrollEvent=!1})}hasNestedScroll(t,{deltaX:e,deltaY:i}){const s=Date.now();t._lenis||(t._lenis={});const o=t._lenis;let r,a,u,n,l,m,g,f,y,h;if(s-(o.time??0)>2e3){o.time=Date.now();const B=window.getComputedStyle(t);if(o.computedStyle=B,r=["auto","overlay","scroll"].includes(B.overflowX),a=["auto","overlay","scroll"].includes(B.overflowY),l=["auto"].includes(B.overscrollBehaviorX),m=["auto"].includes(B.overscrollBehaviorY),o.hasOverflowX=r,o.hasOverflowY=a,!(r||a))return!1;g=t.scrollWidth,f=t.scrollHeight,y=t.clientWidth,h=t.clientHeight,u=g>y,n=f>h,o.isScrollableX=u,o.isScrollableY=n,o.scrollWidth=g,o.scrollHeight=f,o.clientWidth=y,o.clientHeight=h,o.hasOverscrollBehaviorX=l,o.hasOverscrollBehaviorY=m}else u=o.isScrollableX,n=o.isScrollableY,r=o.hasOverflowX,a=o.hasOverflowY,g=o.scrollWidth,f=o.scrollHeight,y=o.clientWidth,h=o.clientHeight,l=o.hasOverscrollBehaviorX,m=o.hasOverscrollBehaviorY;if(!(r&&u||a&&n))return!1;const S=Math.abs(e)>=Math.abs(i)?"horizontal":"vertical";let v,L,O,q,A,H;if(S==="horizontal")v=Math.round(t.scrollLeft),L=g-y,O=e,q=r,A=u,H=l;else if(S==="vertical")v=Math.round(t.scrollTop),L=f-h,O=i,q=a,A=n,H=m;else return!1;return!H&&(v>=L||v<=0)?!0:(O>0?v<L:v>0)&&q&&A}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?"x":"y"]}get isHorizontal(){return this.options.orientation==="horizontal"}get actualScroll(){const t=this.options.wrapper;return this.isHorizontal?t.scrollX??t.scrollLeft:t.scrollY??t.scrollTop}get scroll(){return this.options.infinite?jt(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return this.limit===0?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(t){this._isScrolling!==t&&(this._isScrolling=t,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(t){this._isStopped!==t&&(this._isStopped=t,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(t){this._isLocked!==t&&(this._isLocked=t,this.updateClassName())}get isSmooth(){return this.isScrolling==="smooth"}get className(){let t="lenis";return this.options.autoToggle&&(t+=" lenis-autoToggle"),this.isStopped&&(t+=" lenis-stopped"),this.isLocked&&(t+=" lenis-locked"),this.isScrolling&&(t+=" lenis-scrolling"),this.isScrolling==="smooth"&&(t+=" lenis-smooth"),t}updateClassName(){this.cleanUpClassName(),this.className.split(" ").forEach(t=>{this.rootElement.classList.add(t)})}cleanUpClassName(){for(const t of Array.from(this.rootElement.classList))(t==="lenis"||t.startsWith("lenis-"))&&this.rootElement.classList.remove(t)}};const te=`#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_uv;
void main() {
  v_uv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`,ee=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

#define NUM_COLORS 8

uniform vec4 u_colors[NUM_COLORS];
uniform int u_colors_length;
uniform float u_seed;
uniform float u_speed;
uniform float u_loop;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_turbIter;
uniform float u_waveFreq;
uniform float u_distBias;
uniform float u_jellify;
uniform float u_ditherMode;
uniform float u_dither;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

uvec3 hash3(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 seedRandom(float s) {
  uvec3 u = uvec3(floatBitsToUint(s), floatBitsToUint(s*1.5+7.31), floatBitsToUint(s*2.7+13.37));
  u = hash3(u);
  return vec3(u) / float(0xFFFFFFFFu);
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c)  { return pow(clamp(c,0.0,1.0), vec3(0.4545)); }

vec3 linearToOklab(vec3 c) {
  float l = 0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b;
  float m = 0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b;
  float s = 0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b;
  l = pow(max(l,0.0), 1.0/3.0); m = pow(max(m,0.0), 1.0/3.0); s = pow(max(s,0.0), 1.0/3.0);
  return vec3(
    0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
    1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
    0.0259040371*l + 0.7827717662*m - 0.8086757660*s);
}
vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z;
  float m = c.x - 0.1055613458*c.y - 0.0638541728*c.z;
  float s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  return vec3(
     4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
    -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
    -0.0041960863*l - 0.7034186147*m + 1.7076147010*s);
}
vec3 oklabToLch(vec3 lab) { return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y)); }
vec3 lchToOklab(vec3 lch) { return vec3(lch.x, lch.y*cos(lch.z), lch.y*sin(lch.z)); }
vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
  vec3 lch0 = oklabToLch(lab0);
  vec3 lch1 = oklabToLch(lab1);
  if (lch0.y < 0.05) lch0.z = lch1.z;
  if (lch1.y < 0.05) lch1.z = lch0.z;
  float dh = lch1.z - lch0.z;
  if (dh > 3.14159265) dh -= 6.28318530;
  if (dh < -3.14159265) dh += 6.28318530;
  return lchToOklab(vec3(mix(lch0.x, lch1.x, t), mix(lch0.y, lch1.y, t), lch0.z + dh*t));
}

vec3 getColor(int idx) {
  if (u_colors_length < 1) return vec3(0.0);
  int safeIdx = clamp(idx, 0, u_colors_length - 1);
  return u_colors[safeIdx].rgb;
}
vec3 paletteN(float t, int count) {
  if (count < 1) return vec3(0.0);
  if (count < 2) return toLinear(getColor(0));
  float seg = 1.0 / float(count - 1);
  t = clamp(t, 0.0, 1.0);
  int idx = min(int(floor(t / seg)), count - 2);
  float localT = clamp((t - float(idx) * seg) / seg, 0.0, 1.0);
  vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
  vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));
  return oklabToLinear(mixLch(lab0, lab1, localT));
}

float IGN(vec2 uv) { return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715)))); }
float quickNoise(vec2 I) { return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453); }
float getDither(vec2 I, float mode) {
  if (mode < 0.5) return 0.5;
  if (mode < 1.5) return IGN(I);
  return quickNoise(I);
}

vec3 softGamutMap(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  if (minC >= 0.0 && maxC <= 1.0) return c;
  vec3 lab = linearToOklab(max(c, 0.0));
  float L = clamp(lab.x, 0.0, 1.0);
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  float maxChroma = 0.4 * (1.0 - pow(abs(2.0*L - 1.0), 2.0));
  if (C > maxChroma * 0.7) {
    float knee = maxChroma * 0.7;
    C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
  }
  return clamp(oklabToLinear(vec3(L, C*cos(h), C*sin(h))), 0.0, 1.0);
}
vec3 applyContrastSaturation(vec3 c, float contrast, float saturation) {
  vec3 lab = linearToOklab(c);
  float C = length(lab.yz);
  float h = atan(lab.z, lab.y);
  lab.x = clamp((lab.x - 0.5) * contrast + 0.5, 0.0, 1.0);
  C *= saturation;
  lab.y = C * cos(h);
  lab.z = C * sin(h);
  return oklabToLinear(lab);
}

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  vec2 r = u_resolution;
  vec2 p = (fragCoord * 2.0 - r) / r.y;

  int colorCount = u_colors_length;
  if (colorCount < 1) { fragColor = vec4(0.0,0.0,0.0,1.0); return; }

  float t = u_time * 0.3;

  float looping = step(0.5, u_loop);
  float phase = TAU * u_time / max(u_loop, 0.01);
  float radius = u_loop * u_speed * 0.3 / TAU;
  float tA = sin(phase) * radius;
  float tB = (1.0 - cos(phase)) * radius;

  vec3 seedOffset  = seedRandom(u_seed);
  vec3 seedOffset2 = seedRandom(u_seed + 100.0);

  float seedAngle = u_seed * GOLDEN_ANGLE;
  vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

  float cs = cos(seedAngle);
  float sn = sin(seedAngle);
  p = mat2(cs, -sn, sn, cs) * p;

  float totalVal = 0.0;
  float totalWeight = 0.0;
  int turbIter = int(u_turbIter);
  float freq = 1.0 / max(u_turbFreq, 0.01);

  for (float i = 0.0; i < 4.0; i++) {
    float eph = i / 4.0;
    vec2 q = p * u_scale;
    float sq = eph * eph;
    if (u_jellify > 0.5) q.yx *= mix(1.0, 0.5, 1.0 - exp(-sq));

    float a = seedPhase.x;
    float d = seedPhase.y;
    for (int j = 2; j < 13; j++) {
      if (j >= turbIter) break;
      float fj = float(j);
      float t1 = mix(t * u_speed, tA, looping);
      float t2 = mix(t * u_speed, tB, looping);
      q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;
      a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z + t2 * 0.3 * looping);
      d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y + t2 * 0.3 * looping);
    }
    float v = 0.5 + 0.5 * sin(length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + i * i + seedOffset.x);
    float weight = smoothstep(0.0, 0.5, eph) * smoothstep(1.0, 0.5, eph);
    totalVal += v * weight;
    totalWeight += weight;
  }

  float val = totalVal / totalWeight;
  val = clamp((val - 0.3) / 0.4, 0.0, 1.0);
  val = pow(val, exp(-u_distBias));
  val = clamp(val, 0.0, 1.0);

  // Silk base
  vec3 col = paletteN(val, colorCount);
  col *= u_exposure;
  col = applyContrastSaturation(col, u_contrast, u_saturation);
  col = softGamutMap(col);
  col = toSrgb(col);

  // Metallic dot overlay — silver pearls with radial highlight
  vec2 dotCoord = fragCoord / u_pixelRatio;
  float cellPx = 5.0;
  float ang = 0.2618;
  float ca = cos(ang), sa = sin(ang);
  vec2 rCoord = mat2(ca, -sa, sa, ca) * dotCoord;
  vec2 cellUV = fract(rCoord / cellPx) - 0.5;
  float dotDist = length(cellUV) * 2.0;
  float dotMask = smoothstep(0.5 + 0.08, 0.5 - 0.08, dotDist);
  float hl = pow(clamp(1.0 - dotDist / 0.5, 0.0, 1.0), 2.0);
  vec3 dotCol = mix(vec3(0.44, 0.60, 0.74), vec3(0.93, 0.97, 1.0), hl);
  col = mix(col, dotCol, dotMask * 0.3);

  fragColor = vec4(col, 1.0);
}`,W={colors:new Float32Array([.4863,.7216,.9098,1,.6431,.8118,.9412,1,.7843,.8941,.9725,1,.3529,.6039,.8314,1,.9294,.9647,1,1,0,0,0,0,0,0,0,0,0,0,0,0]),colorsLength:5,seed:689,speed:.79,loop:0,scale:.28,turbAmp:0,turbFreq:2,turbIter:9,waveFreq:2.5,distBias:0,jellify:0,ditherMode:1,dither:.1,exposure:1.1,contrast:1.1,saturation:1};function At(t,e,i){const s=t.createShader(e);if(t.shaderSource(s,i),t.compileShader(s),!t.getShaderParameter(s,t.COMPILE_STATUS)){const o=t.getShaderInfoLog(s);throw t.deleteShader(s),new Error("Shader compile error: "+o)}return s}function ie(t){const e=t.getContext("webgl2",{antialias:!1,premultipliedAlpha:!1});if(!e)return console.warn("WebGL2 not supported — silk shader skipped"),null;const i=At(e,e.VERTEX_SHADER,te),s=At(e,e.FRAGMENT_SHADER,ee),o=e.createProgram();if(e.attachShader(o,i),e.attachShader(o,s),e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS))throw new Error("Program link error: "+e.getProgramInfoLog(o));e.useProgram(o);const r=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,-1,1,0,1,1,-1,1,0,1,1,1,1]),e.STATIC_DRAW);const a=e.getAttribLocation(o,"a_position"),u=e.getAttribLocation(o,"a_texCoord");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,16,0),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,2,e.FLOAT,!1,16,8);const n=A=>e.getUniformLocation(o,A),l={colors:n("u_colors"),colorsLength:n("u_colors_length"),seed:n("u_seed"),speed:n("u_speed"),loop:n("u_loop"),scale:n("u_scale"),turbAmp:n("u_turbAmp"),turbFreq:n("u_turbFreq"),turbIter:n("u_turbIter"),waveFreq:n("u_waveFreq"),distBias:n("u_distBias"),jellify:n("u_jellify"),ditherMode:n("u_ditherMode"),dither:n("u_dither"),exposure:n("u_exposure"),contrast:n("u_contrast"),saturation:n("u_saturation"),time:n("u_time"),resolution:n("u_resolution"),pixelRatio:n("u_pixelRatio")};e.uniform4fv(l.colors,W.colors),e.uniform1i(l.colorsLength,W.colorsLength),e.uniform1f(l.seed,W.seed),e.uniform1f(l.speed,W.speed),e.uniform1f(l.loop,W.loop),e.uniform1f(l.scale,W.scale),e.uniform1f(l.turbAmp,W.turbAmp),e.uniform1f(l.turbFreq,W.turbFreq),e.uniform1f(l.turbIter,W.turbIter),e.uniform1f(l.waveFreq,W.waveFreq),e.uniform1f(l.distBias,W.distBias),e.uniform1f(l.jellify,W.jellify),e.uniform1f(l.ditherMode,W.ditherMode),e.uniform1f(l.dither,W.dither),e.uniform1f(l.exposure,W.exposure),e.uniform1f(l.contrast,W.contrast),e.uniform1f(l.saturation,W.saturation);let m=Math.min(window.devicePixelRatio||1,2),g=0,f=0;function y(){const A=t.getBoundingClientRect(),H=Math.max(1,Math.floor(A.width*m)),B=Math.max(1,Math.floor(A.height*m));H===g&&B===f||(g=H,f=B,t.width=H,t.height=B,e.viewport(0,0,H,B),e.uniform2f(l.resolution,H,B),e.uniform1f(l.pixelRatio,m))}const h=performance.now();let S=!0,v=0;const L=1e3/60;function O(A){S&&(A-v>=L-1&&(v=A,y(),e.uniform1f(l.time,(A-h)/1e3),e.drawArrays(e.TRIANGLES,0,6)),requestAnimationFrame(O))}requestAnimationFrame(O);const q=new IntersectionObserver(([A])=>{S=A.isIntersecting,S&&(v=0,requestAnimationFrame(O))},{threshold:0});return q.observe(t),window.addEventListener("resize",y),{canvas:t,gl:e,stop:()=>{S=!1,q.disconnect()}}}const Rt=document.querySelector(".A-hero canvas.silk");Rt&&ie(Rt);const oe=new Zt({duration:1.15,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:!0,smoothTouch:!1});function Ft(t){oe.raf(t),requestAnimationFrame(Ft)}requestAnimationFrame(Ft);const se=[...document.querySelectorAll(".A-section")].map(t=>({section:t,body:t.querySelector(".A-section__body")})).filter(t=>t.body);let St=!1;function Pt(){St=!1;const t=window.innerHeight,e=t,i=t*.5;for(const{section:s,body:o}of se){const r=o.getBoundingClientRect().top,a=(e-r)/(e-i),u=Math.max(0,Math.min(1,a));s.style.setProperty("--tuck",u.toFixed(3))}}const zt=document.querySelector(".A-bigfoot");zt&&new IntersectionObserver(([t])=>document.body.classList.toggle("is-bigfoot-visible",t.isIntersecting),{threshold:.1}).observe(zt);const Ct=document.querySelector(".A-hero, .P-hero");if(Ct)new IntersectionObserver(([t])=>document.body.classList.toggle("is-scrolled",!t.isIntersecting),{threshold:0}).observe(Ct);else{const t=()=>document.body.classList.toggle("is-scrolled",window.scrollY>30);window.addEventListener("scroll",t,{passive:!0}),t()}function Wt(){St||(St=!0,requestAnimationFrame(Pt))}window.addEventListener("scroll",Wt,{passive:!0});window.addEventListener("resize",Wt,{passive:!0});Pt();(function(){const t=document.createElement("div");t.className="col-grid",t.setAttribute("aria-hidden","true");for(let e=0;e<4;e++){const i=document.createElement("div");i.className="col-grid__col",t.appendChild(i)}document.body.appendChild(t)})();document.querySelectorAll(".A-topbar__center a, .A-topbar__right a").forEach(t=>{const e=t.getAttribute("href");if(!e||e.startsWith("mailto:")||e.includes(".pdf"))return;const i=window.location.pathname;(e==="/"?i==="/":i.startsWith(e))&&t.setAttribute("aria-current","page")});const et=document.querySelector("#work");if(et){const t=[...et.querySelectorAll(".work-index__item")],e=et.querySelector(".work-carousel__track"),i=t.length,s="transform 0.7s cubic-bezier(.7, 0, .2, 1)",o=720,r=2800;if(e&&e.firstElementChild){const v=e.firstElementChild.cloneNode(!0);v.setAttribute("aria-hidden","true"),v.setAttribute("tabindex","-1"),e.appendChild(v)}let a=0,u=null;const n=(v=!0)=>{const L=a%i;t.forEach((O,q)=>O.classList.toggle("is-active",q===L)),e&&(e.style.transition=v?s:"none",e.style.transform=`translateX(-${a*100}%)`)},l=()=>{a++,n(!0),a===i&&setTimeout(()=>{a=0,n(!1)},o)};let m=!1,g=0;const f=()=>{y(),!m&&(u=setInterval(l,r))},y=()=>{u&&(clearInterval(u),u=null)},h=et.querySelector(".work-carousel");h&&(h.addEventListener("mouseenter",y),h.addEventListener("mouseleave",f));const S=et.querySelector(".work-index");S&&(S.addEventListener("mouseenter",()=>{m||(g=a%i,m=!0,y())}),S.addEventListener("mouseleave",()=>{m&&(m=!1,a=g,n(!0),f())}),t.forEach((v,L)=>{v.addEventListener("mouseenter",()=>{m&&a!==L&&(a=L,n(!0))})})),new IntersectionObserver(([v])=>v.isIntersecting?f():y(),{threshold:.2}).observe(et),n(!1)}const Nt=document.querySelector("#trifecta"),dt=document.querySelector(".A-foot");if(Nt&&dt){const t=()=>{const e=Nt.getBoundingClientRect().top,i=window.innerHeight,s=dt.offsetHeight,o=i-s,a=Math.max(0,Math.min(o,e))-o;dt.style.transform=`translateY(${a}px)`;const u=Math.min(Math.abs(a)/Math.max(1,o),1);dt.style.setProperty("--lift",u.toFixed(3))};window.addEventListener("scroll",t,{passive:!0}),window.addEventListener("resize",t,{passive:!0}),t()}function ne(t){const e=t.querySelector(".A-graph__canvas"),i=e.getContext("2d"),s=t.querySelector(".A-graph__title"),o=[...t.querySelectorAll(".A-graph__word")],r=o.map((d,p)=>({id:p,el:d,text:d.textContent,x:0,y:0,vx:0,vy:0,alpha:0,lineProgress:0,alphaDelay:Math.random()*1500,centerLineAlpha:1,flashUntil:0}));let a=null,u=!1,n=null,l={width:0,height:0,yOffset:0};const m={};let g=Math.min(window.devicePixelRatio||1,2);function f(){const d=t.getBoundingClientRect();e.width=Math.max(1,Math.round(d.width*g)),e.height=Math.max(1,Math.round(d.height*g)),i.setTransform(g,0,0,g,0,0);const p=s.getBoundingClientRect(),F=window.innerWidth<640?12:25;l={width:p.width+2*F,height:p.height+2*F,yOffset:p.top+p.height/2-(d.top+d.height/2)};for(const M of r){const R=M.el.getBoundingClientRect();m[M.id]={width:R.width,height:R.height}}}function y(){const d=t.getBoundingClientRect();for(const p of r)p.x=Math.random()*d.width,p.y=Math.random()*d.height,p.vx=(Math.random()-.5)*.5,p.vy=(Math.random()-.5)*.5,p.alpha=0,p.lineProgress=0,p.centerLineAlpha=1,p.flashUntil=0}let h=0;function S(d){if(h)for(const p of r){const F=Math.max(0,d-h-p.alphaDelay),M=Math.min(1,F/2e3),R=M<.5?4*M*M*M:1-Math.pow(-2*M+2,3)/2;p.alpha=R,p.lineProgress=R}}function v(){const d=a;if(a=null,d===null||d==="title")return;const p=r.find(R=>R.id===d);if(!p)return;for(const R of r){const U=R.x-p.x,D=R.y-p.y,Y=Math.sqrt(U*U+D*D)||1;R.vx+=U/Y*2.2,R.vy+=D/Y*2.2}const F=Math.random()*Math.PI*2,M=1.2+.5*Math.random();p.vx=Math.cos(F)*M,p.vy=Math.sin(F)*M}function L(d){const p=r[d];!p||(p.alpha??0)<.95||(n&&(clearTimeout(n),n=null),a=d)}function O(d){a===d&&(n&&clearTimeout(n),n=setTimeout(()=>{v(),n=null},70))}function q(){n&&(clearTimeout(n),n=null),a="title",u=!0}function A(){a==="title"&&(n&&clearTimeout(n),n=setTimeout(()=>{const d=t.getBoundingClientRect(),p=d.width/2,F=d.height/2;for(const M of r){const R=M.x-p,U=M.y-F,D=Math.sqrt(R*R+U*U)||1,Y=(Math.random()-.5)*1.5,P=Math.cos(Y),w=Math.sin(Y);M.vx+=(R/D*P-U/D*w)*7*(.8+.8*Math.random()),M.vy+=(R/D*w+U/D*P)*7*(.8+.8*Math.random())}a=null,n=null},70))}o.forEach((d,p)=>{d.addEventListener("mouseenter",()=>L(p)),d.addEventListener("mouseleave",()=>O(p))}),s.addEventListener("mouseenter",q),s.addEventListener("mouseleave",A);function H(d){u||setTimeout(B,d)}function B(){if(u)return;if(a!==null){H(5e3);return}const d=r.filter(F=>(F.alpha??0)>=.95);if(d.length===0){H(1500);return}const p=d[Math.floor(Math.random()*d.length)];a=p.id,H(6500),setTimeout(()=>{a===p.id&&!u&&v()},1500)}let J=!1,j=0;function it(d){if(!J){j=0;return}const p=t.getBoundingClientRect(),F=p.width,M=p.height;if(F===0||M===0){j=requestAnimationFrame(it);return}const R=F/2,U=M/2;S(d),i.clearRect(0,0,F,M);const D=a,Y=D!==null&&D!=="title",P=Y?r.find(w=>w.id===D):null;for(const w of r){const X=D===w.id;let{x:C,y:x,vx:b,vy:_}=w;const G=m[w.id]||{width:100,height:30};if(X)b*=.55,_*=.55;else if(Y&&P){const E=P.x-C,T=P.y-x,N=Math.sqrt(E*E+T*T)||1;if(N<380){const k=E/N,I=T/N;if(N>95){const z=.022*Math.min(1,(380-N)/200);b+=k*z,_+=I*z}else{const z=.05*(1-N/95);b-=k*z,_-=I*z}}for(const k of r){if(k.id===w.id||k.id===D)continue;const I=C-k.x,z=x-k.y,V=I*I+z*z;if(V<3364&&V>1){const K=Math.sqrt(V),ht=.05*(1-K/58);b+=I/K*ht,_+=z/K*ht}}}else if(D==="title"){const E=R-C,T=U-x,N=Math.sqrt(E*E+T*T)||1;b+=E/N*.04,_+=T/N*.04;for(const k of r){if(k.id===w.id)continue;const I=C-k.x,z=x-k.y,V=I*I+z*z;if(V<5625&&V>1){const K=Math.sqrt(V),ht=.08*(1-K/75);b+=I/K*ht,_+=z/K*ht}}}if(Math.abs(b)>.3&&(b*=.98),Math.abs(_)>.3&&(_*=.98),C+=b,x+=_,l.width>0&&l.height>0){const E=l.width/2+G.width/2,T=l.height/2+G.height/2,N=C-R,k=x-(U+l.yOffset);if(Math.abs(N)<E&&Math.abs(k)<T){const I=E-Math.abs(N),z=T-Math.abs(k);I<z?N>0?(C+=I,b=Math.abs(b)):(C-=I,b=-Math.abs(b)):k>0?(x+=z,_=Math.abs(_)):(x-=z,_=-Math.abs(_)),d>(w.flashUntil||0)+120&&(w.flashUntil=d+240)}}const ot=G.width/2,st=ot+20,nt=F-ot-20;st<=nt?C<=st?(C=st,b=Math.max(Math.abs(b),.2)):C>=nt&&(C=nt,b=-Math.max(Math.abs(b),.2)):(C=F/2,b=0);const rt=G.height/2,Q=rt+20,lt=M-rt-20;Q<=lt?x<=Q?(x=Q,_=Math.max(Math.abs(_),.2)):x>=lt&&(x=lt,_=-Math.max(Math.abs(_),.2)):(x=M/2,_=0),w.x=C,w.y=x,w.vx=b,w.vy=_;let ft=C,xt=x;X&&(ft+=(Math.random()-.5)*1.6,xt+=(Math.random()-.5)*1.6),w.el.style.transform=`translate3d(${ft}px, ${xt}px, 0) translate(-50%, -50%)`,w.el.style.opacity=w.alpha;const mt=R,pt=U+(l.yOffset||0);let Z=mt,tt=pt,at=C,ct=x;if(l.width>0){const E=at-mt,T=ct-pt,N=l.width/2,k=l.height/2;let I=1/0,z=1/0;E>0?I=N/E:E<0&&(I=-N/E),T>0?z=k/T:T<0&&(z=-k/T);const V=Math.min(I,z,1);Z=mt+E*V,tt=pt+T*V}const _t=Z-at,Tt=tt-ct,vt=Math.min(G.width/2/Math.abs(_t||1),G.height/2/Math.abs(Tt||1));vt<1&&(at+=_t*vt,ct+=Tt*vt);const Dt=(at-Z)**2+(ct-tt)**2,gt=w.lineProgress??w.alpha;let wt=1;if(Y&&!X&&P){const E=C-P.x,T=x-P.y,N=Math.sqrt(E*E+T*T);N<=320?wt=0:N<380&&(wt=(N-320)/60)}w.centerLineAlpha+=(wt-w.centerLineAlpha)*.06;const yt=w.centerLineAlpha;if(Dt>100&&gt>.01&&yt>.02){const E=Math.max(0,(w.flashUntil||0)-d),T=E>0?Math.pow(E/240,2):0;T>0?(i.strokeStyle=`rgba(4, 8, 61, ${(.7+.3*T)*yt})`,i.lineWidth=.5+.7*T):(i.strokeStyle=`rgba(83, 83, 82, ${yt})`,i.lineWidth=.5),i.beginPath(),i.moveTo(Z,tt),i.lineTo(Z+(at-Z)*gt,tt+(ct-tt)*gt),i.stroke()}}if(Y&&P){const w=m[P.id]||{width:80,height:30};for(const X of r){if(X.id===P.id)continue;const C=Math.min(1,X.alpha??1);if(C<.02)continue;const x=X.x-P.x,b=X.y-P.y,_=Math.sqrt(x*x+b*b)||1;if(_>=380)continue;const G=(_>320?(380-_)/60:1)*C*Math.min(1,P.alpha??1)*.6;if(G<.02)continue;const ot=Math.min(w.width/2/Math.abs(x||1),w.height/2/Math.abs(b||1),1),st=P.x+x*ot,nt=P.y+b*ot,rt=m[X.id]||{width:80,height:30},Q=Math.min(rt.width/2/Math.abs(x||1),rt.height/2/Math.abs(b||1),1),lt=X.x-x*Q,ft=X.y-b*Q;i.strokeStyle=`rgba(83, 83, 82, ${G})`,i.lineWidth=.5,i.beginPath(),i.moveTo(st,nt),i.lineTo(lt,ft),i.stroke()}}j=requestAnimationFrame(it)}function Ht(){J||(J=!0,h||(f(),y(),h=performance.now(),H(3e3)),j=requestAnimationFrame(it))}function Bt(){J=!1,j&&cancelAnimationFrame(j),j=0}new IntersectionObserver(([d])=>{d.isIntersecting?Ht():Bt()},{threshold:0}).observe(t),window.addEventListener("resize",f),document.fonts&&document.fonts.ready&&document.fonts.ready.then(f)}document.querySelectorAll(".A-graph").forEach(ne);const re=[...document.querySelectorAll(".cc-row")],Ot=225,le=1;re.forEach(t=>{const e=t.querySelector(".cc-row__preview");if(!e)return;let i=0,s=0,o=0,r=0,a=!1,u=0;function n(l){r=0,u||(u=l);let m=(l-u)/1e3;u=l,m>.05&&(m=.05);const g=-320*(s-i),f=-30*o,y=(g+f)/le;o+=y*m,s+=o*m,e.style.transform=`translate3d(${s}px, -50%, 0)`;const h=Math.abs(s-i)<.1&&Math.abs(o)<.1;a&&!h?r=requestAnimationFrame(n):h&&(s=i,o=0,e.style.transform=`translate3d(${s}px, -50%, 0)`)}t.addEventListener("mouseenter",l=>{const m=t.getBoundingClientRect();i=l.clientX-m.left+Ot,s=i,o=0,a=!0,e.style.transform=`translate3d(${s}px, -50%, 0)`}),t.addEventListener("mousemove",l=>{if(!a)return;const m=t.getBoundingClientRect();i=l.clientX-m.left+Ot,r||(u=0,r=requestAnimationFrame(n))}),t.addEventListener("mouseleave",()=>{a=!1,r&&(cancelAnimationFrame(r),r=0),o=0})});const bt=document.querySelector("#play");if(bt){const t=[...bt.querySelectorAll(".play-main__slide")],e=[...bt.querySelectorAll(".play-thumb")];e.forEach((i,s)=>{i.addEventListener("click",()=>{t.forEach((o,r)=>o.classList.toggle("is-active",r===s)),e.forEach((o,r)=>o.classList.toggle("is-active",r===s))})})}const ut=document.querySelector(".A-testimonials__card");if(ut){const t=[...ut.querySelectorAll(".A-testimonials__slide")],e=ut.querySelector(".A-testimonials__name"),i=ut.querySelector(".A-testimonials__count"),s=[...ut.querySelectorAll(".A-testimonials__arrow")];let o=0;const r=u=>String(u).padStart(3,"0"),a=()=>{t.forEach((u,n)=>u.classList.toggle("is-active",n===o)),e&&(e.textContent=t[o].dataset.name),i&&(i.textContent=r(o+1)+" / "+r(t.length))};s.forEach(u=>u.addEventListener("click",()=>{const n=Number(u.dataset.dir);o=(o+n+t.length)%t.length,a()})),a()}const ae={photos:["/photos/photo-1.webp","/photos/photo-2.webp","/photos/photo-3.webp","/photos/photo-4.webp","/photos/photo-5.webp"],albums:["/albums/album-1.webp","/albums/album-2.webp","/albums/album-3.webp","/albums/album-4.webp","/albums/album-5.webp","/albums/album-6.webp","/albums/album-7.webp","/albums/album-8.webp","/albums/album-9.webp"]},qt=document.querySelectorAll('.album[data-mode="photos"], .album[data-mode="albums"]');qt.length&&qt.forEach(i=>{const s=ae[i.dataset.mode];if(!s||s.length===0)return;const o=document.createElement("img");o.className="album__img",o.draggable=!1,o.alt="",i.appendChild(o);let r=Math.floor(Math.random()*s.length);o.src=s[r],o.style.opacity="1";let a=null,u=null;function n(){o.style.opacity="0",u=setTimeout(()=>{r=(r+1)%s.length,o.src=s[r],o.style.opacity="1",u=null},420)}new IntersectionObserver(([m])=>{m.isIntersecting&&!a?a=setInterval(n,2500):!m.isIntersecting&&a&&(clearInterval(a),u&&(clearTimeout(u),u=null),a=null,o.style.opacity="1")},{threshold:0}).observe(i)});
