// Navigation function for workflow items
function navigateTo(page) {
    switch(page) {
        case 'dfa':
            window.location.href = 'dfa.html';
            break;
        case 'simulation':
            window.location.href = 'index.html';
            break;
        case 'input':
            alert('Input processing page would open here');
            break;
        case 'validator':
            alert('Transition validator page would open here');
            break;
        case 'ui':
            alert('UI update page would open here');
            break;
        default:
            console.log('Navigation to ' + page + ' not implemented yet');
    }
}

// Add hover effects to workflow items
document.addEventListener('DOMContentLoaded', function() {
    const workflowItems = document.querySelectorAll('.workflow-item');
    
    workflowItems.forEach(item => {
        // Add mouse enter effect
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.03)';
        });
        
        // Add mouse leave effect
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
});