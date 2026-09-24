(()=>{
  const $=(selector,context=document)=>context.querySelector(selector);
  const $$=(selector,context=document)=>[...context.querySelectorAll(selector)];

  function toast(message,icon='ph-check-circle'){
    let host=$('.toasts');
    if(!host){host=document.createElement('div');host.className='toasts';document.body.append(host)}
    const item=document.createElement('div');item.className='toast';
    item.innerHTML=`<i class="ph ${icon}" aria-hidden="true"></i><span></span>`;
    $('span',item).textContent=message;host.append(item);
    setTimeout(()=>{item.style.opacity='0';item.style.transform='translateY(8px)'},2700);
    setTimeout(()=>item.remove(),3100);
  }

  function updateClock(){
    $$('[data-clock]').forEach(clock=>clock.textContent=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()));
  }
  updateClock();setInterval(updateClock,30000);

  const projectModal=$('#projectModal');
  function closeModal(){projectModal?.classList.remove('open')}
  $$('[data-open-project]').forEach(button=>button.addEventListener('click',()=>projectModal?.classList.add('open')));
  $$('[data-close-modal]').forEach(button=>button.addEventListener('click',closeModal));
  projectModal?.addEventListener('click',event=>{if(event.target===projectModal)closeModal()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeModal();$('#promptBar')?.classList.remove('open')}});
  $('#newProjectForm')?.addEventListener('submit',event=>{event.preventDefault();const name=$('#projectName')?.value.trim()||'Novo projeto';closeModal();toast(`Projeto “${name}” criado com sucesso.`,'ph-rocket-launch');setTimeout(()=>location.href='projects.html',700)});

  $$('[data-toast]').forEach(button=>button.addEventListener('click',()=>toast(button.dataset.toast,button.dataset.icon||'ph-check-circle')));
  $('[data-toggle-prompt]')?.addEventListener('click',()=>{const bar=$('#promptBar');bar?.classList.toggle('open');if(bar?.classList.contains('open'))setTimeout(()=>$('#homePrompt')?.focus(),80)});
  function startPrompt(){const input=$('#homePrompt');if(!input?.value.trim())return;localStorage.setItem('nexora-pending-prompt',input.value.trim());location.href='chat.html'}
  $('[data-start-prompt]')?.addEventListener('click',startPrompt);
  $('#homePrompt')?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();startPrompt()}});

  const projectSearch=$('#projectSearch');
  projectSearch?.addEventListener('input',()=>{const query=projectSearch.value.toLowerCase();$$('[data-project-name]').forEach(item=>item.hidden=!item.dataset.projectName.toLowerCase().includes(query))});
  $$('[data-open-chat]').forEach(card=>card.addEventListener('click',event=>{if(event.target.closest('button,a'))return;localStorage.setItem('nexora-project',card.dataset.project||'Nexora Agentic Builder');location.href='chat.html'}));

  function appendUserMessage(text){
    const messages=$('#messages');if(!messages)return;
    const article=document.createElement('article');article.className='message user';
    article.innerHTML='<div class="avatar">AV</div><div class="bubble"></div>';
    $('.bubble',article).textContent=text;messages.append(article);messages.scrollTop=messages.scrollHeight;
  }
  function appendAssistant(){
    const messages=$('#messages');if(!messages)return;
    const article=document.createElement('article');article.className='message';
    article.innerHTML='<div class="avatar"><i class="ph ph-terminal-window"></i></div><div class="bubble"><div class="message-meta">Nexora · analisando</div><span class="typing"><i></i><i></i><i></i></span></div>';
    messages.append(article);messages.scrollTop=messages.scrollHeight;
    setTimeout(()=>{$('.bubble',article).innerHTML='<div class="message-meta">Nexora · agora</div><p>Entendi. Estruturei a solicitação, preservei as decisões do projeto e adicionei a próxima execução à fila de construção.</p>';messages.scrollTop=messages.scrollHeight;toast('Solicitação adicionada à execução.','ph-lightning')},900);
  }
  function sendChat(){const input=$('#chatInput');if(!input?.value.trim())return;appendUserMessage(input.value.trim());input.value='';appendAssistant()}
  $('[data-send-chat]')?.addEventListener('click',sendChat);
  $('#chatInput')?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChat()}});
  const pending=localStorage.getItem('nexora-pending-prompt');if(pending&&$('#messages')){localStorage.removeItem('nexora-pending-prompt');appendUserMessage(pending);appendAssistant()}

  const fileInput=$('#fileInput');
  function addFiles(files){
    const list=$('#sourceList');if(!list||!files.length)return;
    [...files].forEach(file=>{const row=document.createElement('div');row.className='source-item';row.innerHTML='<span class="source-icon"><i class="ph ph-file-code"></i></span><span class="source-copy"><strong></strong><small></small></span><button class="source-remove" aria-label="Remover arquivo"><i class="ph ph-x"></i></button>';$('strong',row).textContent=file.name;$('small',row).textContent=`${(file.name.split('.').pop()||'FILE').toUpperCase()} · ${Math.max(1,file.size/1024).toFixed(0)} KB`;list.append(row)});toast(`${files.length} arquivo${files.length>1?'s':''} anexado${files.length>1?'s':''}.`,'ph-upload-simple')
  }
  fileInput?.addEventListener('change',()=>addFiles(fileInput.files));
  $('#dropzone')?.addEventListener('click',()=>fileInput?.click());
  document.addEventListener('click',event=>{const remove=event.target.closest('.source-remove');if(remove){remove.closest('.source-item')?.remove();toast('Fonte removida.','ph-trash')}});

  $$('[data-detail-tab]').forEach(button=>button.addEventListener('click',()=>{
    $$('[data-detail-tab]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});
    $$('[data-detail-view]').forEach(view=>view.classList.toggle('active',view.dataset.detailView===button.dataset.detailTab));
  }));
  // Chat do projeto (chat.html): painel de módulos, agente 3D, código e preview
  const moduleSide=$('#moduleSide');
  if(moduleSide){
    const shell=$('.chat-shell'),collapseButton=$('[data-module-collapse]',moduleSide),preview=$('#previewWindow');
    let agentRequested=false;
    function loadAgent(){
      if(agentRequested)return;agentRequested=true;
      const host=$('.agent-model',moduleSide);if(!host)return;
      const sources=['assets/js/vendor/three.min.js','assets/js/vendor/GLTFLoader.js','assets/js/vendor/OrbitControls.js','assets/models/brain-hologram/brain_hologram.glb.part1.js','assets/models/brain-hologram/brain_hologram.glb.part2.js','assets/js/brain3d.js'];
      (function next(index){
        if(index===sources.length){window.NexoraBrain3D?.(host);return}
        const script=document.createElement('script');script.src=sources[index];
        script.onload=()=>next(index+1);
        script.onerror=()=>{const status=$('.core-model-status',host);if(status)status.textContent='Não foi possível carregar o agente.'};
        document.body.append(script);
      })(0);
    }
    // Só carrega o modelo 3D quando a aba Agente estiver visível (evita travar o celular com o painel fechado)
    const drawerMode=matchMedia('(max-width:1050px)');
    function maybeLoadAgent(){
      if($('.module-tab.active',moduleSide)?.dataset.module!=='agent')return;
      const visible=drawerMode.matches?moduleSide.classList.contains('mobile-open'):!shell.classList.contains('modules-collapsed');
      if(visible)loadAgent();
    }
    function setCollapsed(collapsed){
      shell.classList.toggle('modules-collapsed',collapsed);
      const label=collapsed?'Expandir painel':'Recolher painel';
      collapseButton.setAttribute('aria-expanded',String(!collapsed));collapseButton.setAttribute('aria-label',label);collapseButton.dataset.tooltip=label;
      $('i',collapseButton).className='ph ph-caret-double-'+(collapsed?'right':'left');
      try{localStorage.setItem('nexora-modules-collapsed',collapsed?'1':'0')}catch(error){}
      if(!collapsed)maybeLoadAgent();
    }
    function selectModule(name){
      $$('.module-tab',moduleSide).forEach(tab=>{const active=tab.dataset.module===name;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$('i',tab).className=(active?'ph-fill':'ph')+' ph-'+tab.dataset.icon});
      $$('[data-module-view]',moduleSide).forEach(view=>view.classList.toggle('active',view.dataset.moduleView===name));
      $('#moduleTitle').textContent=$(`.module-tab[data-module="${name}"]`,moduleSide).dataset.title;
      if(name==='agent')loadAgent();
    }
    const tabs=$$('.module-tab',moduleSide);
    tabs.forEach((tab,index)=>{
      tab.tabIndex=tab.classList.contains('active')?0:-1;
      tab.addEventListener('click',()=>{if(shell.classList.contains('modules-collapsed'))setCollapsed(false);selectModule(tab.dataset.module);if(tab.dataset.module==='preview')openPreview()});
      tab.addEventListener('keydown',event=>{const step={ArrowDown:1,ArrowUp:-1}[event.key];if(!step)return;event.preventDefault();const target=tabs[(index+step+tabs.length)%tabs.length];target.focus();target.click()});
    });
    // Largura do painel: arrastar a borda direita. Mínimo = largura padrão (404px), só aumenta.
    const moduleResize=$('.module-resize',moduleSide),minModules=404;
    const clampModules=width=>Math.round(Math.max(minModules,Math.min(width,innerWidth*0.6)));
    function setModulesWidth(width,save){shell.style.setProperty('--modules-width',clampModules(width)+'px');if(save)try{localStorage.setItem('nexora-modules-width',String(clampModules(width)))}catch(error){}}
    try{const saved=Number(localStorage.getItem('nexora-modules-width'));if(saved)setModulesWidth(saved)}catch(error){}
    moduleResize?.addEventListener('pointerdown',event=>{
      event.preventDefault();moduleResize.setPointerCapture(event.pointerId);shell.classList.add('resizing');
      const left=moduleSide.getBoundingClientRect().left;
      const move=moveEvent=>setModulesWidth(moveEvent.clientX-left);
      const stop=()=>{shell.classList.remove('resizing');setModulesWidth(moduleSide.getBoundingClientRect().width,true);moduleResize.removeEventListener('pointermove',move);moduleResize.removeEventListener('pointerup',stop);moduleResize.removeEventListener('pointercancel',stop)};
      moduleResize.addEventListener('pointermove',move);moduleResize.addEventListener('pointerup',stop);moduleResize.addEventListener('pointercancel',stop);
    });
    moduleResize?.addEventListener('keydown',event=>{const step={ArrowRight:40,ArrowLeft:-40}[event.key];if(!step)return;event.preventDefault();setModulesWidth(moduleSide.getBoundingClientRect().width+step,true)});
    moduleResize?.addEventListener('dblclick',()=>setModulesWidth(minModules,true));
    collapseButton.addEventListener('click',()=>setCollapsed(!shell.classList.contains('modules-collapsed')));
    try{if(localStorage.getItem('nexora-modules-collapsed')==='1')setCollapsed(true)}catch(error){}

    const drawerToggle=document.createElement('button');drawerToggle.type='button';drawerToggle.className='icon-btn modules-toggle';drawerToggle.setAttribute('aria-label','Módulos do projeto');drawerToggle.innerHTML='<i class="ph ph-sidebar-simple"></i>';$('.runbar')?.append(drawerToggle);
    drawerToggle.addEventListener('click',()=>{moduleSide.classList.toggle('mobile-open');maybeLoadAgent()});
    $('[data-module-close]',moduleSide)?.addEventListener('click',()=>moduleSide.classList.remove('mobile-open'));

    $$('[data-code-file]',moduleSide).forEach(button=>button.addEventListener('click',()=>{
      $$('[data-code-file]',moduleSide).forEach(item=>item.classList.toggle('active',item===button));
      $('#codeBody').innerHTML=$(`template[data-code-template="${button.dataset.codeFile}"]`).innerHTML;
      $('#codeName').textContent=button.dataset.codeName;$('#codeDiff').textContent=button.dataset.codeDiff;
    }));

    function openPreview(){if(!preview)return;preview.classList.add('open');preview.setAttribute('aria-hidden','false');moduleSide.classList.remove('mobile-open')}
    function closePreview(){if(!preview)return;preview.classList.remove('open');preview.setAttribute('aria-hidden','true')}
    $$('[data-open-preview]').forEach(button=>button.addEventListener('click',openPreview));
    $('[data-preview-close]',preview)?.addEventListener('click',closePreview);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closePreview()});
    $$('[data-preview-device]',preview).forEach(button=>button.addEventListener('click',()=>{
      $$('[data-preview-device]',preview).forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});
      $('.preview-frame',preview).dataset.device=button.dataset.previewDevice;
    }));
    $('[data-preview-reload]',preview)?.addEventListener('click',()=>{const frame=$('.preview-frame',preview);frame.classList.add('reloading');setTimeout(()=>{frame.classList.remove('reloading');toast('Preview atualizado · build #148.','ph-arrow-clockwise')},500)});
    const handle=$('.preview-resize',preview);
    const clampWidth=width=>Math.max(360,Math.min(width,innerWidth-120));
    handle?.addEventListener('pointerdown',event=>{
      event.preventDefault();handle.setPointerCapture(event.pointerId);preview.classList.add('resizing');
      const right=innerWidth-preview.getBoundingClientRect().right;
      const move=moveEvent=>{preview.style.width=clampWidth(innerWidth-right-moveEvent.clientX)+'px'};
      const stop=()=>{preview.classList.remove('resizing');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',stop);handle.removeEventListener('pointercancel',stop)};
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
    });
    handle?.addEventListener('keydown',event=>{const step={ArrowLeft:40,ArrowRight:-40}[event.key];if(!step)return;event.preventDefault();preview.style.width=clampWidth(preview.getBoundingClientRect().width+step)+'px'});

    if(document.readyState==='complete')maybeLoadAgent();else addEventListener('load',maybeLoadAgent,{once:true});
  }

  $$('[data-billing]').forEach(button=>button.addEventListener('click',()=>{$$('[data-billing]').forEach(item=>item.classList.toggle('active',item===button));$$('.price[data-month]').forEach(price=>price.innerHTML=`${button.dataset.billing==='year'?price.dataset.year:price.dataset.month} <small>/mês</small>`)}));
  $$('[data-plan]').forEach(button=>button.addEventListener('click',()=>toast(`Plano ${button.dataset.plan} selecionado.`,'ph-seal-check')));

  $$('.profile-tab[data-settings]').forEach(button=>button.addEventListener('click',()=>{$$('.profile-tab[data-settings]').forEach(item=>item.classList.toggle('active',item===button));$$('.settings-view').forEach(view=>view.classList.toggle('active',view.dataset.settings===button.dataset.settings))}));
  const themes={amber:['#f1904e','#ffc08e'],green:['#61e083','#adffbd'],blue:['#56a3ff','#96c9ff']};
  $$('.theme-card').forEach(button=>button.addEventListener('click',()=>{$$('.theme-card').forEach(item=>item.classList.toggle('active',item===button));const colors=themes[button.dataset.theme];document.documentElement.style.setProperty('--copper',colors[0]);document.documentElement.style.setProperty('--copper2',colors[1]);localStorage.setItem('nexora-theme',button.dataset.theme);toast('Atmosfera visual atualizada.','ph-palette')}));
  const savedTheme=localStorage.getItem('nexora-theme');if(savedTheme&&themes[savedTheme]){document.documentElement.style.setProperty('--copper',themes[savedTheme][0]);document.documentElement.style.setProperty('--copper2',themes[savedTheme][1]);$$('.theme-card').forEach(item=>item.classList.toggle('active',item.dataset.theme===savedTheme))}
  $$('form[data-save]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();toast('Alterações salvas.','ph-check-circle')}));

  // Lista de chats (chats.html)
  const chatSearch=$('#chatSearch');let chatFilter='all';
  function filterChats(){
    const query=(chatSearch?.value||'').trim().toLowerCase();let visible=0;
    $$('[data-chat]').forEach(row=>{const match=(chatFilter==='all'||row.dataset.project===chatFilter)&&row.textContent.toLowerCase().includes(query);row.hidden=!match;if(match)visible++});
    $$('[data-chat-group]').forEach(group=>group.hidden=!$$('[data-chat]',group).some(row=>!row.hidden));
    const empty=$('.chat-empty');if(empty)empty.hidden=visible>0;
  }
  chatSearch?.addEventListener('input',filterChats);
  $$('[data-chat-filter]').forEach(button=>button.addEventListener('click',()=>{chatFilter=button.dataset.chatFilter;$$('[data-chat-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});filterChats()}));
  $$('[data-chat]').forEach(row=>row.addEventListener('click',()=>{try{localStorage.setItem('nexora-project',row.dataset.project)}catch(error){}}));
  $('[data-new-chat]')?.addEventListener('click',()=>{toast('Novo chat iniciado.','ph-chats');setTimeout(()=>location.href='chat.html',600)});

  // Tooltip em botões e itens de menu (usa data-tooltip ou aria-label)
  const tipTargets='[data-tooltip],.preview-seg button[aria-label],.glass-key[aria-label],.icon-btn[aria-label],.round-key[aria-label],.source-remove[aria-label]';
  const tip=document.createElement('div');tip.className='tooltip';tip.setAttribute('role','tooltip');tip.setAttribute('aria-hidden','true');document.body.append(tip);
  let tipTimer=0,tipOwner=null;
  function showTip(target){
    const text=target.dataset.tooltip||target.getAttribute('aria-label');if(!text)return;
    tipOwner=target;tip.textContent=text;tip.style.transform='translate(-9999px,0)';tip.classList.add('show');
    const box=target.getBoundingClientRect(),size=tip.getBoundingClientRect();
    let top=box.top-size.height-10;if(top<8)top=box.bottom+10;
    const left=Math.max(8,Math.min(box.left+box.width/2-size.width/2,innerWidth-size.width-8));
    tip.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;
  }
  function hideTip(){clearTimeout(tipTimer);tipOwner=null;tip.classList.remove('show')}
  document.addEventListener('pointerover',event=>{if(event.pointerType!=='mouse')return;const target=event.target.closest(tipTargets);if(!target||target===tipOwner)return;hideTip();tipTimer=setTimeout(()=>showTip(target),280)});
  document.addEventListener('pointerout',event=>{const target=event.target.closest(tipTargets);if(target&&!target.contains(event.relatedTarget))hideTip()});
  document.addEventListener('focusin',event=>{const target=event.target.closest(tipTargets);if(target&&target.matches(':focus-visible'))showTip(target)});
  document.addEventListener('focusout',hideTip);
  document.addEventListener('pointerdown',hideTip);
  addEventListener('scroll',hideTip,true);

  $('#loginForm')?.addEventListener('submit',event=>{event.preventDefault();const button=$('[type="submit"]',event.currentTarget);button.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';setTimeout(()=>location.href='index.html',650)});
})();
