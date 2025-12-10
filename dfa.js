// Add interactive effects to state boxes
document.addEventListener('DOMContentLoaded', function() {
    const stateBoxes = document.querySelectorAll('.state-box');
    
    stateBoxes.forEach(box => {
        // Add mouse enter effect
        box.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.03)';
        });
        
        // Add mouse leave effect
        box.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Add click effects to state boxes
    stateBoxes.forEach(box => {
        box.addEventListener('click', function() {
            // Remove active class from all boxes
            stateBoxes.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked box
            this.classList.add('active');
            
            // Show additional information about the state
            const stateName = this.querySelector('h3').textContent;
            showStateInfo(stateName);
        });
    });
});

function showStateInfo(stateName) {
    // In a real implementation, this would show more detailed information
    // about the selected state in a modal or info panel
    console.log(`Showing information for ${stateName}`);
}