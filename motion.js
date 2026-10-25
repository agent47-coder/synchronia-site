(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce)return;
  var d=document,h=d.documentElement;
  h.classList.add('mo');
  /* 1. Révélation au scroll, avec cascade */
  var sel='.wrap>h2,.wrap>.eyebrow,.wrap>.psub,.wrap>p,.why-item,.pcard,.product,.tier,.stp,.pp,.step,.p-visual,.p-flow,.offer-poster,.rlayer';
  var els=[].slice.call(d.querySelectorAll('main '+sel.split(',').join(',main ')));
  els.forEach(function(e,i){
    if(e.closest('.hero,.ovl,.panel,[hidden]'))return;
    e.classList.add('rv');
    var sib=e.parentNode?[].indexOf.call(e.parentNode.children,e):0;
    e.style.setProperty('--d',Math.min(sib,6)*0.08+'s');
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    d.querySelectorAll('.rv').forEach(function(e){io.observe(e)});
  }else{d.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')})}
  window.addEventListener('scroll',function(){if(innerHeight+scrollY>=d.body.scrollHeight-8)d.querySelectorAll('.rv:not(.in)').forEach(function(e){e.classList.add('in')})},{passive:true});
  /* 2. Séquence lumineuse sur les schémas de flux */
  d.querySelectorAll('.p-flow .row').forEach(function(r){
    [].forEach.call(r.querySelectorAll('.node'),function(n,i){n.style.setProperty('--i',i)});
  });
  /* 3. Réseau vivant dans le hero */
  var hero=d.querySelector('.hero');if(!hero)return;
  var c=d.createElement('canvas');c.id='netbg';hero.insertBefore(c,hero.firstChild);
  var x=c.getContext('2d'),W,H,P=[],dpr=Math.min(window.devicePixelRatio||1,2),run=true,mx=-999,my=-999;
  function size(){W=hero.clientWidth;H=hero.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.max(22,Math.min(60,Math.round(W*H/22000)));
    P=[];for(var i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.4+.8,g:Math.random()<.2})}
  size();window.addEventListener('resize',size);
  hero.addEventListener('pointermove',function(e){var b=hero.getBoundingClientRect();mx=e.clientX-b.left;my=e.clientY-b.top});
  hero.addEventListener('pointerleave',function(){mx=my=-999});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){run=es[0].isIntersecting;if(run)loop()}).observe(hero);
  var L=130;
  function loop(){
    if(!run||d.hidden)return;
    x.clearRect(0,0,W,H);
    for(var i=0;i<P.length;i++){
      var p=P[i];p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
      var dx=p.x-mx,dy=p.y-my,dm=Math.sqrt(dx*dx+dy*dy);
      if(dm<110){p.x+=dx/dm*.9;p.y+=dy/dm*.9}
      for(var j=i+1;j<P.length;j++){
        var q=P[j],ax=p.x-q.x,ay=p.y-q.y,dd=ax*ax+ay*ay;
        if(dd<L*L){var a=(1-Math.sqrt(dd)/L)*.35;x.strokeStyle='rgba(61,220,151,'+a+')';x.lineWidth=.7;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}
      }
      x.fillStyle=p.g?'rgba(34,211,238,.9)':'rgba(61,220,151,.75)';x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill();
    }
    requestAnimationFrame(loop);
  }
  d.addEventListener('visibilitychange',function(){if(!d.hidden&&run)loop()});
  loop();
})();
