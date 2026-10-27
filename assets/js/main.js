const header=document.getElementById('header')
const isSubPage=document.body.classList.contains('page-sub') // 下層ページは常に背景付き
const onScrollHeader=()=>{header.classList.toggle('solid',isSubPage||window.scrollY>window.innerHeight*0.75)}
window.addEventListener('scroll',onScrollHeader,{passive:true})
onScrollHeader()
// 比較表の固定見出しがヘッダーに隠れないよう、ヘッダーの高さをCSS変数に渡す
;new ResizeObserver(()=>document.documentElement.style.setProperty('--header-h',header.offsetHeight+'px')).observe(header)

const navToggle=document.querySelector('.nav-toggle')
const primaryNav=document.getElementById('primary-nav')
const main=document.getElementById('main')
const mobileNavMq=matchMedia('(max-width: 900px)')
const subItems=[...primaryNav.querySelectorAll('.has-sub')]

function getNavFocusables(){
  return [navToggle,...primaryNav.querySelectorAll('a, .sub-toggle')].filter(el=>{
    if(el.closest('.sub-nav')&&!el.closest('.has-sub.is-open')) return false
    return true
  })
}

function closeAllSubs(except){
  subItems.forEach(item=>{
    if(item===except) return
    item.classList.remove('is-open')
    const btn=item.querySelector('.sub-toggle')
    if(btn){
      btn.setAttribute('aria-expanded','false')
      const label=btn.getAttribute('aria-label')||''
      btn.setAttribute('aria-label',label.replace('閉じる','開く'))
    }
  })
}

function setSubOpen(item,isOpen){
  const btn=item.querySelector('.sub-toggle')
  item.classList.toggle('is-open',isOpen)
  if(!btn) return
  btn.setAttribute('aria-expanded',String(isOpen))
  const base=btn.getAttribute('aria-label').replace(/(を開く|を閉じる)$/,'')
  btn.setAttribute('aria-label',`${base}${isOpen?'を閉じる':'を開く'}`)
}

function setNavOpen(isOpen){
  document.body.classList.toggle('nav-open',isOpen)
  primaryNav.classList.toggle('is-open',isOpen)
  navToggle.setAttribute('aria-expanded',String(isOpen))
  navToggle.setAttribute('aria-label',isOpen?'メニューを閉じる':'メニューを開く')
  if(main) main.inert=isOpen
  document.body.style.overflow=isOpen?'hidden':''
  if(!isOpen){
    closeAllSubs()
    navToggle.focus()
    return
  }
  const firstLink=primaryNav.querySelector('.nav-link')
  firstLink?.focus()
}

navToggle.addEventListener('click',()=>setNavOpen(!primaryNav.classList.contains('is-open')))

subItems.forEach(item=>{
  const btn=item.querySelector('.sub-toggle')
  const parentLink=item.querySelector('.nav-link')

  btn.addEventListener('click',e=>{
    e.preventDefault()
    e.stopPropagation()
    const willOpen=!item.classList.contains('is-open')
    closeAllSubs(item)
    setSubOpen(item,willOpen)
  })

  // PC: ホバーでも開く（キーボードはボタン操作）
  item.addEventListener('mouseenter',()=>{
    if(mobileNavMq.matches) return
    closeAllSubs(item)
    setSubOpen(item,true)
  })
  item.addEventListener('mouseleave',()=>{
    if(mobileNavMq.matches) return
    setSubOpen(item,false)
  })

  parentLink.addEventListener('click',()=>{
    if(primaryNav.classList.contains('is-open')) setNavOpen(false)
  })
})

primaryNav.querySelectorAll('.sub-nav a').forEach(link=>{
  link.addEventListener('click',()=>{
    closeAllSubs()
    if(primaryNav.classList.contains('is-open')) setNavOpen(false)
  })
})

primaryNav.querySelectorAll('.nav-link').forEach(link=>{
  if(link.closest('.has-sub')) return
  link.addEventListener('click',()=>{
    if(primaryNav.classList.contains('is-open')) setNavOpen(false)
  })
})

document.addEventListener('click',e=>{
  if(mobileNavMq.matches) return
  if(!primaryNav.contains(e.target)) closeAllSubs()
})

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(primaryNav.classList.contains('is-open')){
      const openSub=primaryNav.querySelector('.has-sub.is-open')
      if(openSub){
        setSubOpen(openSub,false)
        openSub.querySelector('.sub-toggle')?.focus()
        return
      }
      setNavOpen(false)
      return
    }
    closeAllSubs()
    return
  }

  if(e.key!=='Tab'||!primaryNav.classList.contains('is-open')) return
  const focusables=getNavFocusables()
  const first=focusables[0],last=focusables[focusables.length-1]
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
})

mobileNavMq.addEventListener('change',e=>{
  closeAllSubs()
  if(!e.matches) setNavOpen(false)
})

// ---------- Hero動画:画面幅でPC/SP版を出し分け ----------
;(()=>{
  const v=document.getElementById('heroVideo');
  if(!v)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){v.remove();return} // ポスター静止画のみ
  v.src=innerWidth<=900?'assets/hero-sp.mp4':'assets/hero.mp4';
  v.addEventListener('playing',()=>v.classList.add('ready'),{once:true});
  v.play().catch(()=>{}); // 自動再生不可の環境ではポスター表示のまま
})();

// ---------- Works動画:画面内のカードだけ読み込み・再生 ----------
;(()=>{
  const vids=[...document.querySelectorAll('.work-video')];
  if(!vids.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return; // ポスター静止画のみ
  const wio=new IntersectionObserver(es=>{
    es.forEach(e=>{
      const v=e.target;
      if(e.isIntersecting){
        if(!v.src)v.src=v.dataset.src;
        v.play().catch(()=>{});
      }else if(!v.paused){v.pause()}
    });
  },{rootMargin:'0px 200px'});
  vids.forEach(v=>wio.observe(v));
})();

const io=new IntersectionObserver(es=>{
  es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})
},{threshold:.15,rootMargin:'0px 0px -8% 0px'})
document.querySelectorAll('.rv').forEach(el=>io.observe(el))

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
if(!reduced){
  const targets=[...document.querySelectorAll('[data-parallax]')]
  let ticking=false
  const parallax=()=>{
    targets.forEach(t=>{
      const r=t.parentElement.getBoundingClientRect()
      if(r.bottom<0||r.top>innerHeight) return
      const p=(r.top+r.height/2-innerHeight/2)/innerHeight
      t.style.transform=`translateY(${p*-40}px)`
    })
    ticking=false
  }
  window.addEventListener('scroll',()=>{
    if(!ticking){requestAnimationFrame(parallax);ticking=true}
  },{passive:true})
  parallax()
}
