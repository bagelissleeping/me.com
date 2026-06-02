// script.js

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add print functionality
function printResume() {
    window.print();
}

// Function to enable high definition print mode
function enableHighDefinitionPrint() {
    // Show confirmation dialog
    if (confirm('是否启用低清打印模式？此模式将优化简历以生成更小的PDF文件。')) {
        // Apply high definition print optimizations
        applyHighDefinitionPrintOptimizations();
        
        // Trigger print after a short delay to allow styles to apply
        setTimeout(() => {
            window.print();
        }, 500);
    }
}

// Function to apply high definition print optimizations
function applyHighDefinitionPrintOptimizations() {
    // Change image source to optimized version
    const profileImage = document.querySelector('.profile-image img');
    if (profileImage) {
        profileImage.src = './me-optimized.png';
        profileImage.alt = '个人照片 (优化版)';
    }
    
    // Add print-specific styles
    const printStyles = `
        <style id="hd-print-styles" media="print">
            /* 为打印优化图片 */
            .profile-image img {
                max-width: 90px;
                max-height: 120px;
                image-rendering: -webkit-optimize-contrast;
            }
            
            /* 简化打印样式 */
            body {
                font-size: 12px;
            }
            
            .header {
                padding: 10px 20px;
            }
            
            section {
                padding: 10px 20px;
            }
            
            section h2 {
                font-size: 16px;
                margin-bottom: 8px;
            }
            
            section h3 {
                font-size: 13px;
                margin: 8px 0 5px;
            }
            
            section p {
                margin-bottom: 5px;
            }
            
            .skill-category {
                margin-bottom: 10px;
            }
            
            .job, .internship-item, .education-item, .project {
                margin-bottom: 10px;
                padding-bottom: 8px;
            }
            
            ul, ol {
                padding-left: 15px;
            }
            
            li {
                margin-bottom: 4px;
            }
        </style>
    `;
    
    // Add fontawesome minimal CSS for print
    const fontStyles = `
        <link id="hd-print-fonts" rel="stylesheet" href="./fontawesome/css/minimal.css" media="print">
    `;
    
    // Add styles to head
    document.head.insertAdjacentHTML('beforeend', printStyles);
    document.head.insertAdjacentHTML('beforeend', fontStyles);
    
    // Add cleanup function to restore original state after print
    window.addEventListener('afterprint', restoreOriginalState);
}

// Function to restore original state after printing
function restoreOriginalState() {
    // Remove added styles
    const hdPrintStyles = document.getElementById('hd-print-styles');
    const hdPrintFonts = document.getElementById('hd-print-fonts');
    
    if (hdPrintStyles) hdPrintStyles.remove();
    if (hdPrintFonts) hdPrintFonts.remove();
    
    // Restore original image
    const profileImage = document.querySelector('.profile-image img');
    if (profileImage) {
        profileImage.src = './me.png';
        profileImage.alt = '个人照片';
    }
    
    // Remove this event listener
    window.removeEventListener('afterprint', restoreOriginalState);
}

// Function to toggle dark mode
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    // Update button text and icon
    const darkModeButton = document.querySelector('.dark-mode-toggle');
    const icon = darkModeButton.querySelector('i');
    
    if (body.classList.contains('dark-mode')) {
        darkModeButton.innerHTML = '<i class="fas fa-sun"></i> 亮色模式';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        darkModeButton.innerHTML = '<i class="fas fa-moon"></i> 暗色模式';
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Function to calculate age based on birthday
function calculateAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred this year yet, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Function to update age display
// 在 index.html 同目录创建 config.js 并设置 window.RESUME_BIRTHDAY = 'YYYY-MM-DD' 即可自动计算年龄
function updateAge() {
    try {
        const birthday = typeof window !== 'undefined' ? window.RESUME_BIRTHDAY : null;
        const ageElement = document.getElementById('age');
        if (!ageElement) return;

        if (!birthday) {
            ageElement.textContent = '—';
            return;
        }

        const age = calculateAge(birthday);
        ageElement.textContent = age;
    } catch (error) {
        console.error('更新年龄时出错:', error);
    }
}

// Check for saved dark mode preference and update age
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 恢复暗色模式设置
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            const darkModeButton = document.querySelector('.dark-mode-toggle');
            if (darkModeButton) {
                darkModeButton.innerHTML = '<i class="fas fa-sun"></i> 亮色模式';
            }
        }
        
        // 更新年龄显示
        updateAge();
        
        console.log('简历页面加载成功');
    } catch (error) {
        console.error('页面初始化时出错:', error);
    }
});

// 如果DOM已经加载完成，立即执行
if (document.readyState === 'loading') {
    // DOM还在加载中，等待DOMContentLoaded事件
} else {
    // DOM已经加载完成，立即执行
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        const darkModeButton = document.querySelector('.dark-mode-toggle');
        if (darkModeButton) {
            darkModeButton.innerHTML = '<i class="fas fa-sun"></i> 亮色模式';
        }
    }
    updateAge();
}