
// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered: ', registration);
            })
            .catch(registrationError => {
                console.log('Service Worker registration failed: ', registrationError);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const upiDataKey = 'upiData';
    const historyKey = 'upiHistory';
    const qrModalOverlay = document.getElementById('qr-modal-overlay');
    const mainView = document.getElementById('main-view');
    const historyView = document.getElementById('history-view');
    const historyBtn = document.getElementById('history-btn');
    const historyIcon = document.getElementById('history-icon');
    const upiButtonContainer = document.getElementById('upi-button-container');
    const amountInput = document.getElementById('amountInput');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const selectedUpiIdDisplay = document.getElementById('selected-upi-id');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const amountDisplay = document.getElementById('amount-display');
    const popupUpiButtons = document.getElementById('popup-upi-buttons');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const dialPad = document.getElementById('dial-pad');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    let upiData = JSON.parse(localStorage.getItem(upiDataKey)) || [{
        "id": "9492416477@upi",
        "label": "TVR",
        "icon": "https://ucarecdn.com/19a5ba37-4a18-471f-a5d8-5e9689551355/-/format/auto/",
        "color": "#e05244", // TVR Red
        "oppositeColor": "#46b6e0",
        "iconBg": "#ffffff",
        "iconBorder": "#e05244"
    }, {
        "id": "9885848524@upi",
        "label": "TSK",
        "icon": "https://img.icons8.com/color/512/bhim.png",
        "color": "#018b3d", // TSK Green
        "oppositeColor": "#ff7909",
        "iconBg": "#ffffff",
        "iconBorder": "#018b3d"
    }, {
        "id": "9398096059@superyes",
        "label": "BGV",
        "icon": "https://ucarecdn.com/caa1a595-b532-46b1-b4d4-1c5e21486b85/-/format/webp/-/quality/smart/",
        "color": "#4d43fe", // BGV is Blue
        "oppositeColor": "#ffffff",
        "iconBg": "#ffffff",
        "iconBorder": "#4d43fe"
    }, {
        "id": "Q639488204@ybl",
        "label": "PhonePe",
        "icon": "https://img.utdstc.com/icon/a06/2b4/a062b4fb17896e98996ae80f05de6ceeafda19e3247c92d495214dbc1ea4f050:200",
        "color": "#017c07", // PhonePe is Green
        "oppositeColor": "#ffffff",
        "iconBg": "#ffffff",
        "iconBorder": "#017c07"
    }];

    let state = {
        currentView: 'main',
        selectedUpiId: null,
        amount: ''
    };

    const qrColorPalettes = [
        ["#1BE7FF", "#6EEB83", "#E4FF1A"],
        ["#F2F3AE", "#EDD382", "#FC9E4F"],
        ["#C5F9D7", "#F7D486", "#F27A7D"],
        ["#DEEFB7", "#98DFAF", "#5FB49C"],
        ["#F08700", "#F49F0A", "#EFCA08"],
        ["#FFFD82", "#FF9B71", "#E84855"],
        ["#FF5C4D", "#FF9636", "#FFCD58"],
        ["#FF8370", "#00B1B0", "#FEC84D"],
        ["#FEDE00", "#B4F8C8", "#6AB8EE"]
    ];

    // Functions to manage state and UI updates
    const updateState = (newState) => {
        state = { ...state, ...newState };
        render();
    };

    const render = () => {
        // Render the correct view based on state.currentView
        mainView.classList.toggle('hidden', state.currentView !== 'main');
        historyView.classList.toggle('hidden', state.currentView !== 'history');

        historyIcon.innerText = state.currentView === 'main' ? 'history' : 'arrow_back';
        
        // Render UPI buttons
        renderUpiButtons();
        
        // Update Amount Input
        amountInput.value = state.amount;
        clearInputBtn.classList.toggle('hidden', state.amount.length === 0);

        if (state.currentView === 'history') {
            renderHistory();
        }

        // Update selected UPI ID display
        const selectedUpi = upiData.find(u => u.id === state.selectedUpiId);
        selectedUpiIdDisplay.textContent = selectedUpi ? selectedUpi.label : "Select a UPI ID";
    };

    const renderUpiButtons = () => {
        upiButtonContainer.innerHTML = '';
        popupUpiButtons.innerHTML = '';

        upiData.forEach(upi => {
            // Main buttons
            const mainBtn = createUpiButton(upi, false);
            upiButtonContainer.appendChild(mainBtn);

            // Popup buttons
            const popupBtn = createUpiButton(upi, true);
            popupUpiButtons.appendChild(popupBtn);
        });
    };

    const createUpiButton = (upi, isPopup) => {
        const button = document.createElement('button');
        button.setAttribute('data-upi-id', upi.id);
        
        if (isPopup) {
            button.className = `w-16 h-16 p-2 bg-gray-900 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 relative popup-upi-btn`;
            button.style.borderColor = upi.color;
            button.innerHTML = `<img src="${upi.icon}" alt="${upi.label} Icon" class="w-10 h-10 rounded-full" onerror="this.onerror=null;this.src='https://placehold.co/40x40/4B5563/D1D5DB?text=Icon'">`;
        } else {
            button.className = `upi-btn focus:outline-none`;
            button.style.setProperty('--color-active', upi.oppositeColor);
            button.style.setProperty('--color-hover', upi.color);
            button.style.setProperty('--color-icon-bg', upi.iconBg);
            button.style.setProperty('--color-icon-border', upi.iconBorder);
            button.style.color = upi.color;
            button.innerHTML = `
                <div class="upi-icon-container">
                    <img src="${upi.icon}" alt="${upi.label} Icon" onerror="this.onerror=null;this.src='https://placehold.co/40x40/4B5563/D1D5DB?text=Icon'">
                </div>
                <span class="text-lg font-bold" style="font-family: 'Karla', sans-serif;">${upi.label}</span>
            `;
        }

        // Apply active styles if needed
        if (state.selectedUpiId === upi.id) {
            if (isPopup) {
                button.classList.add('popup-upi-btn-active');
                button.style.boxShadow = `0 0 0 2px #0c0d10, 0 0 0 4px ${upi.oppositeColor}`;
            } else {
                button.classList.add('upi-btn-active');
                button.style.borderColor = upi.oppositeColor;
                button.style.color = upi.oppositeColor;
            }
        }

        return button;
    };

    const calculateAmount = (value) => {
        if (!value) return '';
        try {
            const sanitizedValue = value.replace(/[^-+*/().0-9]/g, '');
            const fixedValue = sanitizedValue.replace(/(\d+)\s*\(/g, '$1*(');
            const finalValue = fixedValue.replace(/[-+*/.]+$/, '');
            if (!finalValue) {
                return '';
            }
            const result = Function(`"use strict"; return (${finalValue})`)();
            if (!isNaN(result) && isFinite(result)) {
                return parseFloat(result).toFixed(2);
            }
        } catch (error) {
            console.error("Calculation error:", error);
            return '';
        }
        return '';
    };

    const generateQrCode = (upiId, amount) => {
        qrCodeContainer.classList.add('loading');
        qrCodeContainer.classList.remove('hidden');

        if (typeof window.QRCodeStyling === 'undefined') {
            console.error("QRCodeStyling library not found. Please ensure it is loaded correctly.");
            return;
        }

        const selectedPalette = qrColorPalettes[Math.floor(Math.random() * qrColorPalettes.length)];
        const [dotsColor, cornersSquareColor, cornersDotColor] = selectedPalette;
        const upiInfo = upiData.find(u => u.id === upiId) || {};
        const payeeName = upiInfo.label || upiId;
        const upiIcon = upiInfo.icon;

        let upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}`;
        if (payeeName) upiUri += `&pn=${encodeURIComponent(payeeName)}`;
        if (amount && parseFloat(amount) > 0) {
            upiUri += `&am=${encodeURIComponent(amount)}`;
            upiUri += `&cu=INR`;
        }

        qrCodeContainer.innerHTML = '';
        
        // Arrays of available shapes for dynamic styling
        const dotsOptionsTypes = ["dots", "rounded", "extra-rounded", "square", "circular", "edge-cut-smooth", "leaf", "pointed-edge-cut", "pointed-in-smooth", "pointed-smooth", "round", "rounded-in-smooth", "rounded-pointed", "star", "diamond", "doted-light", "classy", "classy-rounded"];
        const cornersSquareOptionsTypes = ["square", "extra-rounded", "dot", "round", "bevel", "bubble"];
        const cornersDotOptionsTypes = ["square", "dot", "round", "bevel", "bubble"];
        
        // Randomly select a type for each element
        const randomDotsType = dotsOptionsTypes[Math.floor(Math.random() * dotsOptionsTypes.length)];
        const randomCornersSquareType = cornersSquareOptionsTypes[Math.floor(Math.random() * cornersSquareOptionsTypes.length)];
        const randomCornersDotType = cornersDotOptionsTypes[Math.floor(Math.random() * cornersDotOptionsTypes.length)];

        const qrCode = new window.QRCodeStyling({
            width: 300,
            height: 300,
            type: "svg",
            data: upiUri,
            image: upiIcon,
            dotsOptions: { color: dotsColor, type: randomDotsType },
            cornersSquareOptions: { color: cornersSquareColor, type: randomCornersSquareType },
            cornersDotOptions: { color: cornersDotColor, type: randomCornersDotType },
            backgroundOptions: { color: "#000000" },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 5,
                imageSize: 0.3,
                hideBackgroundDots: true
            }
        });
        qrCode.append(qrCodeContainer);
        qrCodeContainer.classList.remove('loading');
        qrCodeContainer.style.opacity = '1';
        amountDisplay.textContent = `₹${parseFloat(amount).toFixed(2)}`;
        amountDisplay.classList.toggle('hidden', !amount || parseFloat(amount) <= 0);
    };

    const saveHistory = (id, amount) => {
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const timestamp = new Date().toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true });
        history.unshift({ id, amount: parseFloat(amount || 0).toFixed(2), timestamp });
        localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
    };

    const renderHistory = () => {
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<p class="text-gray-400 text-center">No payment history found.</p>';
            clearHistoryBtn.classList.add('hidden');
        } else {
            history.forEach((item, index) => {
                const upiInfo = upiData.find(u => u.id === item.id) || {};
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item p-4 bg-gray-900 rounded-xl flex items-center space-x-4 cursor-pointer hover:bg-gray-800 transition-colors duration-200 relative group';
                historyItem.innerHTML = `
                    <img src="${upiInfo.icon}" alt="${upiInfo.label} Icon" class="w-10 h-10 rounded-full" onerror="this.onerror=null;this.src='https://placehold.co/40x40/4B5563?text=Icon'">
                    <div class="flex-1">
                        <p class="text-gray-200 font-semibold" style="font-family: 'Karla', sans-serif;">${upiInfo.label}</p>
                        <p class="text-gray-400 text-sm" style="font-family: 'Karla', sans-serif;">₹${item.amount} - ${item.timestamp}</p>
                    </div>
                    <div class="history-item-actions flex items-center space-x-2 absolute right-4 top-1/2 transform -translate-y-1/2">
                        <button class="regenerate-btn text-gray-400 hover:text-green-500 transition-colors" data-index="${index}">
                            <span class="material-symbols-outlined">sync</span>
                        </button>
                        <button class="delete-btn text-gray-400 hover:text-red-500 transition-colors" data-index="${index}">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                `;
                historyList.appendChild(historyItem);
            });
            clearHistoryBtn.classList.remove('hidden');
        }
    };
    
    // Event Listeners (React-like event delegation)
    historyBtn.addEventListener('click', () => {
        updateState({ currentView: state.currentView === 'main' ? 'history' : 'main' });
    });

    upiButtonContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.upi-btn');
        if (button) {
            const upiId = button.dataset.upiId;
            const calculatedAmount = calculateAmount(amountInput.value.trim());
            generateQrCode(upiId, calculatedAmount);
            saveHistory(upiId, calculatedAmount);
            updateState({ selectedUpiId: upiId });
            qrModalOverlay.classList.remove('hidden');
        }
    });

    popupUpiButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.popup-upi-btn');
        if (button) {
            const upiId = button.dataset.upiId;
            const calculatedAmount = calculateAmount(amountInput.value.trim());
            generateQrCode(upiId, calculatedAmount);
            saveHistory(upiId, calculatedAmount);
            updateState({ selectedUpiId: upiId });
        }
    });

    closeModalBtn.addEventListener('click', () => {
        qrModalOverlay.classList.add('hidden');
    });

    qrModalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'qr-modal-overlay') {
            qrModalOverlay.classList.add('hidden');
        }
    });

    amountInput.addEventListener('input', (e) => {
        let value = e.target.value;
        value = value.replace(/[^-+*/()0-9.]/g, '');
        updateState({ amount: value });
    });

    amountInput.addEventListener('blur', (e) => {
        updateState({ amount: calculateAmount(e.target.value.trim()) });
    });

    clearInputBtn.addEventListener('click', () => {
        updateState({ amount: '' });
    });

    dialPad.addEventListener('click', (e) => {
        e.preventDefault();
        const button = e.target.closest('button');
        if (!button) return;
        const value = button.dataset.value;
        let newAmount = state.amount;
        if (value === 'backspace') {
            newAmount = newAmount.slice(0, -1);
        } else if (value === 'clear') {
            newAmount = '';
        } else if (value === 'equals') {
            newAmount = calculateAmount(newAmount.trim());
        } else {
            newAmount += value;
        }
        updateState({ amount: newAmount });
    });
    
    historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;

        const regenerateBtn = e.target.closest('.regenerate-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        const historyIndex = item.querySelector('[data-index]')?.dataset.index;

        if (regenerateBtn) {
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const selectedItem = history[historyIndex];
            generateQrCode(selectedItem.id, selectedItem.amount);
            saveHistory(selectedItem.id, selectedItem.amount);
            updateState({ selectedUpiId: selectedItem.id });
            qrModalOverlay.classList.remove('hidden');
        } else if (deleteBtn) {
            let currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            currentHistory.splice(historyIndex, 1);
            localStorage.setItem(historyKey, JSON.stringify(currentHistory));
            renderHistory();
        } else {
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            const selectedItem = history[historyIndex];
            generateQrCode(selectedItem.id, selectedItem.amount);
            updateState({ selectedUpiId: selectedItem.id });
            qrModalOverlay.classList.remove('hidden');
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem(historyKey);
        renderHistory();
    });

    // Initial render
    render();
});
