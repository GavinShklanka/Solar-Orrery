// Elegant collapsible info panel system

export function createCollapsiblePanel(id, title, content, color = '#4A90E2') {
  const panel = document.createElement('div');
  panel.id = id;
  panel.className = 'collapsible-panel collapsed';
  panel.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 12px;
    border: 2px solid ${color};
    font-family: Arial, sans-serif;
    z-index: 1000;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    overflow: hidden;
    max-width: 400px;
  `;
  
  // Header (always visible)
  const header = document.createElement('div');
  header.className = 'panel-header';
  header.style.cssText = `
    padding: 15px 20px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
  `;
  
  header.innerHTML = `
    <h3 style="margin: 0; color: ${color}; font-size: 18px;">${title}</h3>
    <span class="toggle-icon" style="color: ${color}; font-size: 20px; transition: transform 0.3s;">▼</span>
  `;
  
  // Content (collapsible)
  const contentDiv = document.createElement('div');
  contentDiv.className = 'panel-content';
  contentDiv.style.cssText = `
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    color: white;
  `;
  
  const innerContent = document.createElement('div');
  innerContent.style.cssText = `
    padding: 0 20px 20px 20px;
    font-size: 14px;
    line-height: 1.6;
  `;
  innerContent.innerHTML = content;
  
  contentDiv.appendChild(innerContent);
  
  panel.appendChild(header);
  panel.appendChild(contentDiv);
  
  // Toggle functionality
  header.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    const isCollapsed = panel.classList.contains('collapsed');
    const icon = header.querySelector('.toggle-icon');
    
    if (isCollapsed) {
      contentDiv.style.maxHeight = '0';
      icon.style.transform = 'rotate(0deg)';
    } else {
      contentDiv.style.maxHeight = contentDiv.scrollHeight + 'px';
      icon.style.transform = 'rotate(180deg)';
    }
  });
  
  document.body.appendChild(panel);
  
  return {
    panel,
    expand: () => {
      panel.classList.remove('collapsed');
      contentDiv.style.maxHeight = contentDiv.scrollHeight + 'px';
      header.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
    },
    collapse: () => {
      panel.classList.add('collapsed');
      contentDiv.style.maxHeight = '0';
      header.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
    },
    remove: () => panel.remove(),
    updateContent: (newContent) => {
      innerContent.innerHTML = newContent;
      if (!panel.classList.contains('collapsed')) {
        contentDiv.style.maxHeight = contentDiv.scrollHeight + 'px';
      }
    }
  };
}

// Minimalist help button
export function createHelpButton() {
  const button = document.createElement('div');
  button.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(74, 144, 226, 0.3);
    border: 2px solid #4A90E2;
    color: #4A90E2;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1001;
    transition: all 0.2s;
    font-weight: bold;
  `;
  button.textContent = '?';
  
  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(74, 144, 226, 0.6)';
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgba(74, 144, 226, 0.3)';
    button.style.transform = 'scale(1)';
  });
  
  document.body.appendChild(button);
  return button;
}