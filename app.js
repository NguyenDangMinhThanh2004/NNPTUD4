const API_URL = 'https://api.escuelajs.co/api/v1/products';

let products = [];
let filtered = [];
let state = {
  page: 1,
  perPage: 10,
  search: '',
  sortKey: null,
  sortDir: 1,
};

const $ = id => document.getElementById(id);

async function init(){
  bindControls();
  await fetchProducts();
  render();
}

function bindControls(){
  $('searchInput').addEventListener('input', e => {
    state.search = e.target.value.trim().toLowerCase();
    state.page = 1;
    render();
  });

  $('perPage').addEventListener('change', e => {
    state.perPage = parseInt(e.target.value, 10);
    state.page = 1;
    render();
  });

  const sortSelect = document.getElementById('sortSelect');
  if(sortSelect){
    sortSelect.addEventListener('change', (e)=>{
      const v = e.target.value;
      if(v === 'none'){
        state.sortKey = null; state.sortDir = 1;
      } else {
        const parts = v.split('|');
        state.sortKey = parts[0];
        state.sortDir = parseInt(parts[1], 10) || 1;
      }
      state.page = 1;
      render();
    });
  }

  const btnReload = document.getElementById('btnReload');
  if(btnReload){
    btnReload.addEventListener('click', async ()=>{
      await fetchProducts();
      render();
    });
  }

  document.querySelectorAll('.sortable').forEach(h => {
    h.addEventListener('click', () => {
      const key = h.dataset.key;
      if(state.sortKey === key) state.sortDir *= -1;
      else { state.sortKey = key; state.sortDir = 1 }
      render();
    });
  });

  $('btnExport').addEventListener('click', () => exportCSV());

  $('saveEdit').addEventListener('click', saveEdit);
  $('saveCreate').addEventListener('click', saveCreate);
  const editToggle = document.getElementById('btnEditToggle');
  if(editToggle){
    editToggle.addEventListener('click', (e)=>{
      const modalEl = document.getElementById('viewModal');
      const editing = modalEl && modalEl.dataset && modalEl.dataset.editing === '1';
      setViewMode(!editing);
    });
  }
}

async function fetchProducts(){
  try{
    const res = await fetch(API_URL);
    products = await res.json();
  }catch(err){
    console.error('Fetch products failed', err);
    products = [];
  }
}

function applyFilters(){
  filtered = products.filter(p => {
    if(!state.search) return true;
    return (p.title || '').toLowerCase().includes(state.search);
  });

  if(state.sortKey){
    filtered.sort((a,b) => {
      let va = a[state.sortKey];
      let vb = b[state.sortKey];
      if(state.sortKey === 'title'){
        va = (va || '').toLowerCase(); vb = (vb || '').toLowerCase();
      }
      if(state.sortKey === 'price'){
        va = Number(va) || 0; vb = Number(vb) || 0;
      }
      if(va < vb) return -1 * state.sortDir;
      if(va > vb) return 1 * state.sortDir;
      return 0;
    });
  }
}

function render(){
  applyFilters();
  renderTable();
  renderPagination();
}

function renderTable(){
  const tbody = document.querySelector('#productsTable tbody');
  tbody.innerHTML = '';
  const start = (state.page-1)*state.perPage;
  const pageItems = filtered.slice(start, start + state.perPage);

  pageItems.forEach(p => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', p.id);
    tr.setAttribute('title', p.description || '');
    tr.classList.add('hover-desc');

    tr.innerHTML = `
      <td>${p.id}</td>
      <td class="title-cell">${escapeHtml(p.title)}</td>
      <td>${p.price}</td>
      <td>${p.category ? escapeHtml(p.category.name || p.category) : ''}</td>
      <td>${renderImages(p.images)}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary view-btn me-1">View</button>
        <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
      </td>
    `;

    // open details when clicking the row or the title cell
    tr.addEventListener('click', () => openViewModal(p.id));
    const titleCell = tr.querySelector('.title-cell');
    if(titleCell) titleCell.addEventListener('click', (e)=>{ e.stopPropagation(); openViewModal(p.id); });

    // view button opens modal readonly
    const viewBtn = tr.querySelector('.view-btn');
    if(viewBtn) viewBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openViewModal(p.id, false); });

    // edit button opens modal with editing enabled
    const editBtn = tr.querySelector('.edit-btn');
    if(editBtn) editBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openViewModal(p.id, true); });
    tbody.appendChild(tr);
  });

  // initialize bootstrap tooltips for description (title attribute)
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('.hover-desc'));
  tooltipTriggerList.forEach(el => {
    // leave default browser tooltip for title text
  });

  updateSortIndicators();
}

function updateSortIndicators(){
  document.querySelectorAll('.sortable').forEach(h => {
    const key = h.dataset.key;
    const span = h.querySelector('.sort-indicator');
    if(!span) return;
    if(state.sortKey === key){
      span.textContent = state.sortDir === 1 ? ' ▲' : ' ▼';
    } else {
      span.textContent = '';
    }
  });
}

function renderImages(images){
  if(!images || images.length === 0) return '';
  const url = images[0];
  return `<img src="${escapeHtml(url)}" class="thumb" alt="img">`;
}

function renderPagination(){
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / state.perPage));
  const ul = $('pagination');
  ul.innerHTML = '';

  const createPageItem = (p, label = null, active=false, disabled=false) => {
    const li = document.createElement('li');
    li.className = 'page-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label || p;
    a.addEventListener('click', (e) => { e.preventDefault(); if(!disabled){ state.page = p; render(); } });
    li.appendChild(a);
    return li;
  };

  ul.appendChild(createPageItem(1, '«', false, state.page===1));

  // show a window around current page
  const windowSize = 5;
  let start = Math.max(1, state.page - Math.floor(windowSize/2));
  let end = Math.min(pages, start + windowSize -1);
  if(end - start < windowSize -1){ start = Math.max(1, end - windowSize +1); }

  for(let i = start; i <= end; i++){
    ul.appendChild(createPageItem(i, null, state.page===i));
  }

  ul.appendChild(createPageItem(pages, '»', false, state.page===pages));
}

function openViewModal(id, openInEdit = false){
  const p = products.find(x => x.id == id);
  if(!p) return;
  $('editId').value = p.id;
  $('editTitle').value = p.title || '';
  $('editPrice').value = p.price || '';
  $('editDescription').value = p.description || '';
  $('editCategoryId').value = p.category && p.category.id ? p.category.id : (p.category || '');
  $('editImages').value = (p.images || []).join(',');
  // set mode based on caller (view or edit)
  setViewMode(!!openInEdit);
  const modal = new bootstrap.Modal(document.getElementById('viewModal'));
  modal.show();
}

function setViewMode(isEditing){
  const fields = ['editTitle','editPrice','editDescription','editCategoryId','editImages'];
  fields.forEach(id => {
    const el = $(id);
    if(!el) return;
    if(isEditing){ el.removeAttribute('readonly'); el.classList.remove('form-control-plaintext'); }
    else { el.setAttribute('readonly',''); }
  });
  const saveBtn = $('saveEdit');
  const editToggle = $('btnEditToggle');
  if(saveBtn) saveBtn.disabled = !isEditing;
  if(editToggle) editToggle.textContent = isEditing ? 'Cancel' : 'Edit';
  if(saveBtn) saveBtn.textContent = isEditing ? 'Update' : 'Save';
  // store current editing state on modal element
  const modalEl = document.getElementById('viewModal');
  modalEl.dataset.editing = isEditing ? '1' : '0';
}

async function saveEdit(){
  const id = $('editId').value;
  const body = {
    title: $('editTitle').value,
    price: parseFloat($('editPrice').value) || 0,
    description: $('editDescription').value,
    categoryId: parseInt($('editCategoryId').value) || undefined,
    images: $('editImages').value ? $('editImages').value.split(',').map(s=>s.trim()) : []
  };
  const saveBtn = $('saveEdit');
  const editToggle = $('btnEditToggle');
  if(saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }
  if(editToggle) editToggle.disabled = true;

  try{
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    if(res.ok){
      const updated = await res.json();
      const idx = products.findIndex(x=>x.id==id);
      if(idx>=0) products[idx] = updated;
      else products.unshift(updated);
      render();
      bootstrap.Modal.getInstance(document.getElementById('viewModal')).hide();
      alert('Cập nhật thành công');
    } else {
      // server returned error - attempt to update locally
      console.error('Update failed, status:', res.status);
      const idx = products.findIndex(x=>x.id==id);
      if(idx>=0) products[idx] = Object.assign({}, products[idx], body);
      render();
      bootstrap.Modal.getInstance(document.getElementById('viewModal')).hide();
      alert('Server trả lỗi khi cập nhật; giao diện đã cập nhật cục bộ.');
    }
  }catch(err){
    console.error('Update failed', err);
    // optimistic local update
    const idx = products.findIndex(x=>x.id==id);
    if(idx>=0) products[idx] = Object.assign({}, products[idx], body);
    render();
    bootstrap.Modal.getInstance(document.getElementById('viewModal')).hide();
    alert('Không thể kết nối tới server; dữ liệu đã cập nhật cục bộ.');
  } finally {
    if(saveBtn){ saveBtn.disabled = false; saveBtn.textContent = 'Update'; }
    if(editToggle) editToggle.disabled = false;
  }
}

async function saveCreate(e){
  e.preventDefault();
  const body = {
    title: $('createTitle').value,
    price: parseFloat($('createPrice').value) || 0,
    description: $('createDescription').value,
    categoryId: parseInt($('createCategoryId').value) || 1,
    images: $('createImages').value ? $('createImages').value.split(',').map(s=>s.trim()) : []
  };

  try{
    // check duplicate by title first
    const title = (body.title || '').trim().toLowerCase();
    const dup = products.find(p => (p.title||'').trim().toLowerCase() === title);
    if(dup){
      const ok = confirm('Có sản phẩm cùng title đã tồn tại. Bạn có muốn cập nhật sản phẩm đó thay vì tạo mới?');
      if(ok){
        // update existing via PUT
        const res = await fetch(`${API_URL}/${dup.id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        if(res.ok){
          const updated = await res.json();
          const idx = products.findIndex(x => x.id == updated.id);
          if(idx>=0) products[idx] = updated;
          render();
          bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
          alert('Đã cập nhật sản phẩm tồn tại.');
          return;
        } else {
          alert('Không thể cập nhật sản phẩm tồn tại trên server.');
          return;
        }
      } else {
        // user cancelled creation
        return;
      }
    }

    const resCreate = await fetch(API_URL, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if(resCreate.ok){
      const created = await resCreate.json();
      if(created && created.id){
        const exists = products.some(x => x.id == created.id);
        if(!exists) products.unshift(created);
        else { const idx = products.findIndex(x => x.id == created.id); products[idx] = created; }
      } else {
        products.unshift(created);
      }
      render();
      bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
      alert('Tạo sản phẩm thành công');
    } else {
      alert('Tạo sản phẩm thất bại, server trả lỗi');
    }
  }catch(err){
    console.error('Create failed', err);
    alert('Create failed - check console');
  }
}

function exportCSV(){
  const start = (state.page-1)*state.perPage;
  const pageItems = filtered.slice(start, start + state.perPage);
  const headers = ['id','title','price','category','images'];
  const rows = [headers.join(',')];
  pageItems.forEach(p => {
    const category = p.category ? (p.category.name || p.category) : '';
    const images = (p.images || []).join(';');
    const row = [p.id, csvEscape(p.title), p.price, csvEscape(category), csvEscape(images)].join(',');
    rows.push(row);
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'products_page.csv';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function escapeHtml(unsafe){
  if(unsafe === undefined || unsafe === null) return '';
  return String(unsafe).replace(/[&<>"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

function csvEscape(str){
  if(str === undefined || str === null) return '""';
  const s = String(str).replace(/"/g, '""');
  return '"' + s + '"';
}

document.addEventListener('DOMContentLoaded', init);
