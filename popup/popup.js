document.addEventListener('DOMContentLoaded', () => {
	const actionButton = document.getElementById('actionButton');

	if (!actionButton) {
		return;
	}

	actionButton.addEventListener('click', () => {
		actionButton.textContent = 'Popup ready';
	});
});
