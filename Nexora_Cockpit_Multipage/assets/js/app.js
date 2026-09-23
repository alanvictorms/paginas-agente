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

  $$('[data-billing]').forEach(button=>button.addEventListener('click',()=>{$$('[data-billing]').forEach(item=>item.classList.toggle('active',item===button));$$('.price[data-month]').forEach(price=>price.innerHTML=`${button.dataset.billing==='year'?price.dataset.year:price.dataset.month} <small>/mês</small>`)}));
  $$('[data-plan]').forEach(button=>button.addEventListener('click',()=>toast(`Plano ${button.dataset.plan} selecionado.`,'ph-seal-check')));

  $$('.profile-tab').forEach(button=>button.addEventListener('click',()=>{$$('.profile-tab').forEach(item=>item.classList.toggle('active',item===button));$$('.settings-view').forEach(view=>view.classList.toggle('active',view.dataset.settings===button.dataset.settings))}));
  const themes={amber:['#f1904e','#ffc08e'],green:['#61e083','#adffbd'],blue:['#56a3ff','#96c9ff']};
  $$('.theme-card').forEach(button=>button.addEventListener('click',()=>{$$('.theme-card').forEach(item=>item.classList.toggle('active',item===button));const colors=themes[button.dataset.theme];document.documentElement.style.setProperty('--copper',colors[0]);document.documentElement.style.setProperty('--copper2',colors[1]);localStorage.setItem('nexora-theme',button.dataset.theme);toast('Atmosfera visual atualizada.','ph-palette')}));
  const savedTheme=localStorage.getItem('nexora-theme');if(savedTheme&&themes[savedTheme]){document.documentElement.style.setProperty('--copper',themes[savedTheme][0]);document.documentElement.style.setProperty('--copper2',themes[savedTheme][1]);$$('.theme-card').forEach(item=>item.classList.toggle('active',item.dataset.theme===savedTheme))}
  $$('form[data-save]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();toast('Alterações salvas.','ph-check-circle')}));

  $('#loginForm')?.addEventListener('submit',event=>{event.preventDefault();const button=$('[type="submit"]',event.currentTarget);button.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';setTimeout(()=>location.href='index.html',650)});
})();
