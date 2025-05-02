// Incluir o script de autenticação
const authScript = document.createElement("script");
authScript.src = "auth.js";
document.head.appendChild(authScript);

// Variáveis globais
let cotacaoTotal = 0;
let totalApostado = 0;
let tesseractWorker = null;
let processedImageData = null;
let soundsEnabled = true; // Variável para controlar se os sons estão ativados
let cambistasCount = 0; // Contador de cambistas
let cambistasInterval = null; // Intervalo para simulação de cambistas
let gameTime = ""; // Variável para armazenar a hora do primeiro jogo
let selectedTitle = ""; // Variável para armazenar o título selecionado pelo usuário
let isCustomTitle = false; // Flag para indicar se o título é personalizado
let selectedTemplate = "padrao"; // Template de bilhete selecionado
// let backgroundImageDataUrl = null; // Data URL da imagem de fundo - REMOVIDO
const imageOverlay = new ImageOverlay(); // Instância da classe ImageOverlay
let authManager = null; // Variável para o gerenciador de autenticação

// Inicialização quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
    // --- Verificação de Autenticação ---
    // Esperar um pouco para garantir que auth.js foi carregado
    setTimeout(() => {
        if (typeof AuthManager !== "undefined" && typeof loginConfig !== "undefined") {
            authManager = new AuthManager(loginConfig);
            if (!authManager.checkAuth()) {
                // Se não estiver autenticado, redireciona para a página de login
                window.location.href = "login.html";
                return; // Interrompe a execução do restante do script
            }
            // Se autenticado, continua carregando a página principal
            initializePage();
        } else {
            // Se auth.js não carregou, tenta novamente ou mostra erro
            console.error("Erro ao carregar o script de autenticação. Tentando recarregar...");
            // Poderia tentar recarregar ou mostrar uma mensagem ao usuário
            // Por simplicidade, vamos apenas redirecionar para login como fallback
            // window.location.href = "login.html"; 
        }
    }, 100); // Pequeno delay para garantir carregamento

    // Função para inicializar o restante da página após a verificação de autenticação
    function initializePage() {
        console.log("Usuário autenticado. Inicializando a página...");

        // --- Elementos da Interface ---
        const uploadArea = document.getElementById("uploadArea");
        const imageUpload = document.getElementById("imageUpload");
        const previewContainer = document.getElementById("previewContainer");
        const imagePreview = document.getElementById("imagePreview");
        const processButton = document.getElementById("processButton");
        const loadingIndicator = document.getElementById("loadingIndicator");
        const resultsSection = document.getElementById("resultsSection");
        const copyButton = document.getElementById("copyButton");
        const viewSavedButton = document.getElementById("viewSavedButton");
        const ticketsModal = document.getElementById("ticketsModal");
        const savedTicketsCloseButton = ticketsModal ? ticketsModal.querySelector(".close-button") : null;
        const modalTicketsList = document.getElementById("modalTicketsList");
        const savedTicketsContainer = document.getElementById("savedTicketsContainer");
        const clearButton = document.getElementById("clearButton");

        // Elementos para código manual
        const manualCodeButton = document.getElementById("manualCodeButton");
        const codeModal = document.getElementById("codeModal");
        const codeCloseButton = codeModal ? codeModal.querySelector(".close-button") : null;
        const manualCodeInput = document.getElementById("manualCodeInput");
        const applyCodeButton = document.getElementById("applyCodeButton");

        // Elementos para calculadoras
        const percentCalcBtn = document.getElementById("percentCalcBtn");
        const percentCalcModal = document.getElementById("percentCalcModal");
        const percentCalcCloseBtn = percentCalcModal ? percentCalcModal.querySelector(".close-button") : null;
        const bancaCalcBtn = document.getElementById("bancaCalcBtn");
        const bancaCalcModal = document.getElementById("bancaCalcModal");
        const bancaCalcCloseBtn = bancaCalcModal ? bancaCalcModal.querySelector(".close-button") : null;
        const gerenteNameInput = document.getElementById("gerenteName");
        const bancosValueInput = document.getElementById("bancosValue");
        const bancaValueInput = document.getElementById("bancaValue");
        const bancosSignSelector = document.getElementById("bancosSignSelector");
        const bancaSignSelector = document.getElementById("bancaSignSelector");
        const descriptionTextInput = document.getElementById("descriptionText");
        const calcBancaBtn = document.getElementById("calcBancaBtn");
        const bancaResultText = document.getElementById("bancaResultText");
        const copyBancaResultBtn = document.getElementById("copyBancaResultBtn");

        // Elementos para contador de cambistas
        const cambistasCounter = document.getElementById("cambistasCounter");

        // Elemento para alternar tema
        const themeToggleBtn = document.getElementById("themeToggleBtn");
        const themeIcon = document.getElementById("themeIcon");

        // Elemento para controle de sons
        const soundToggle = document.getElementById("soundToggle");
        const soundStatus = document.getElementById("soundStatus");

        // Elementos para seleção de título
        const titleSelectionSection = document.querySelector(".title-selection-section");
        const titleDefaultRadio = document.getElementById("titleDefault");
        const titleCustomRadio = document.getElementById("titleCustom");
        const customTitleContainer = document.getElementById("customTitleContainer");
        const customTitleInput = document.getElementById("customTitleInput");
        const confirmTitleButton = document.getElementById("confirmTitleButton");

        // Elementos para seleção de template
        const templateSelectionSection = document.getElementById("templateSelectionSection");
        const confirmTemplateButton = document.getElementById("confirmTemplateButton");
        const templateOptions = document.querySelectorAll("input[name=\"templateOption\"]");

        // Elementos para upload de imagem de fundo e sobreposição - REMOVIDOS

        // Elementos para a seção colapsável "Sobre a Ferramenta"
        const toggleDescriptionBtn = document.getElementById("toggleDescriptionBtn");
        const descriptionContent = document.getElementById("descriptionContent");
        
        // Botão de Logout (adicionar ao HTML se não existir)
        const logoutButton = document.getElementById("logoutButton");

        // --- Inicializações ---
        initTheme();
        initFootballAnimation();
        initSoundControl();
        initCalculators();
        initCambistasCounter();
        initTitleSelection();
        initTemplateSelection(); // Inicializar seleção de template
        // initBackgroundImageUpload(); // REMOVIDO - Inicializar upload de imagem de fundo
        initCollapsibleSection();
        initSavedTickets();
        initLogout(); // Inicializar botão de logout

        // --- Lógica de Logout ---
        function initLogout() {
            if (logoutButton) {
                logoutButton.addEventListener("click", () => {
                    if (authManager) {
                        authManager.logout();
                        window.location.href = "login.html"; // Redireciona para login após logout
                    }
                });
            }
        }
        
        // --- Lógica da Seção Colapsável ---
        function initCollapsibleSection() {
            if (toggleDescriptionBtn && descriptionContent) {
                toggleDescriptionBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    playButtonSound();
                    if (descriptionContent.style.display === "none") {
                        descriptionContent.style.display = "block";
                        toggleDescriptionBtn.querySelector("i").className = "fas fa-chevron-up";
                    } else {
                        descriptionContent.style.display = "none";
                        toggleDescriptionBtn.querySelector("i").className = "fas fa-chevron-down";
                    }
                });
            }
        }

        // --- Lógica de Seleção de Título ---
        function initTitleSelection() {
            if (titleDefaultRadio && titleCustomRadio && customTitleContainer && confirmTitleButton && titleSelectionSection && templateSelectionSection) {
                titleDefaultRadio.addEventListener("change", () => {
                    if (titleDefaultRadio.checked) {
                        customTitleContainer.style.display = "none";
                        playButtonSound();
                    }
                });
                titleCustomRadio.addEventListener("change", () => {
                    if (titleCustomRadio.checked) {
                        customTitleContainer.style.display = "block";
                        customTitleInput.focus();
                        playButtonSound();
                    }
                });

                confirmTitleButton.addEventListener("click", () => {
                    playButtonSound();
                    if (titleCustomRadio.checked) {
                        const customTitle = customTitleInput.value.trim();
                        if (customTitle === "") {
                            alert("Por favor, digite um título personalizado ou selecione a opção padrão.");
                            return;
                        }
                        selectedTitle = customTitle;
                        isCustomTitle = true;
                    } else {
                        selectedTitle = "";
                        isCustomTitle = false;
                    }
                    titleSelectionSection.style.display = "none";
                    templateSelectionSection.style.display = "block"; // Mostrar seleção de template
                    console.log(`Título selecionado: ${isCustomTitle ? selectedTitle : "Padrão"}`);
                });
            }
        }

        // --- Lógica de Seleção de Template ---
        function initTemplateSelection() {
            if (templateOptions && confirmTemplateButton && templateSelectionSection && uploadSection) {
                templateOptions.forEach((radio) => {
                    radio.addEventListener("change", () => {
                        if (radio.checked) {
                            selectedTemplate = radio.value;
                            playButtonSound();
                            console.log(`Template selecionado: ${selectedTemplate}`);
                        }
                    });
                });

                confirmTemplateButton.addEventListener("click", () => {
                    playButtonSound();
                    templateSelectionSection.style.display = "none";
                    uploadSection.style.display = "block"; // Mostrar upload da imagem do bilhete
                });
            }
        }

        // --- Lógica de Upload e Processamento da Imagem do Bilhete ---
        if (uploadArea && imageUpload && previewContainer && imagePreview && processButton && loadingIndicator && resultsSection && codeModal && manualCodeInput && uploadSection && templateSelectionSection && titleSelectionSection) {
            // Removido o evento de clique que acionava programaticamente o input
            // Agora o input será acionado diretamente pelo usuário através do label
            uploadArea.addEventListener("click", () => {
                playButtonSound();
            });

            uploadArea.addEventListener("dragover", (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = "var(--primary-dark)";
                uploadArea.style.backgroundColor = "rgba(255, 0, 128, 0.1)";
            });

            uploadArea.addEventListener("dragleave", () => {
                uploadArea.style.borderColor = "var(--primary-color)";
                uploadArea.style.backgroundColor = "rgba(255, 0, 128, 0.05)";
            });

            uploadArea.addEventListener("drop", (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = "var(--primary-color)";
                uploadArea.style.backgroundColor = "rgba(255, 0, 128, 0.05)";
                if (e.dataTransfer.files.length) {
                    handleImageUpload(e.dataTransfer.files[0]);
                    playButtonSound();
                }
            });

            imageUpload.addEventListener("change", (e) => {
                if (e.target.files.length) {
                    handleImageUpload(e.target.files[0]);
                    playButtonSound();
                }
            });

            processButton.addEventListener("click", async () => {
                playButtonSound();
                previewContainer.style.display = "none";
                loadingIndicator.style.display = "flex";
                resultsSection.style.display = "none";
                // backgroundImageSection.style.display = "none"; // REMOVIDO - Esconder seção de fundo inicialmente

                try {
                    const success = await processImage(imagePreview.src);
                    if (success) {
                        playGoalSound();
                        // backgroundImageSection.style.display = "block"; // REMOVIDO - Mostrar seção de imagem de fundo após processar
                        codeModal.style.display = "flex"; // Abrir modal do código
                        codeModal.classList.add("show");
                        manualCodeInput.value = "";
                        manualCodeInput.focus();
                    } else {
                        alert(
                            "Não foi possível extrair as informações necessárias da imagem. Por favor, tente com outra imagem ou insira os dados manualmente."
                        );
                        uploadArea.style.display = "flex";
                        previewContainer.style.display = "none";
                        imageUpload.value = null;
                        // Voltar para o início do fluxo
                        uploadSection.style.display = "none";
                        templateSelectionSection.style.display = "none";
                        titleSelectionSection.style.display = "block";
                    }
                } catch (error) {
                    console.error("Erro ao processar imagem:", error);
                    alert("Ocorreu um erro ao processar a imagem. Por favor, tente novamente.");
                    uploadArea.style.display = "flex";
                    previewContainer.style.display = "none";
                    imageUpload.value = null;
                    // Voltar para o início do fluxo
                    uploadSection.style.display = "none";
                    templateSelectionSection.style.display = "none";
                    titleSelectionSection.style.display = "block";
                } finally {
                    loadingIndicator.style.display = "none";
                }
            });
        }

        function handleImageUpload(file) {
            if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
                alert("Por favor, selecione uma imagem JPG ou PNG.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.style.display = "block";
                uploadArea.style.display = "none";
            };
            reader.readAsDataURL(file);
        }

        async function initTesseractWorker() {
            if (!tesseractWorker) {
                try {
                    tesseractWorker = await Tesseract.createWorker({
                        logger: (m) => {
                            if (m.status === "recognizing text") {
                                const progress = Math.round(m.progress * 100);
                                console.log(`Progresso OCR: ${progress}%`);
                            }
                        },
                    });
                    await tesseractWorker.load();
                    await tesseractWorker.loadLanguage("por");
                    await tesseractWorker.initialize("por");
                    console.log("Tesseract worker inicializado com sucesso");
                    return true;
                } catch (error) {
                    console.error("Erro ao inicializar Tesseract worker:", error);
                    return false;
                }
            }
            return true;
        }

        async function processImage(imageUrl) {
            try {
                const workerReady = await initTesseractWorker();
                if (!workerReady) {
                    throw new Error("Não foi possível inicializar o Tesseract");
                }
                const result = await tesseractWorker.recognize(imageUrl);
                const text = result.data.text;
                console.log("Texto extraído:\n", text);
                if (!text || text.trim() === "") {
                    console.error("Nenhum texto extraído da imagem");
                    return false;
                }
                const dataExtracted = extractData(text);
                if (!dataExtracted) {
                    console.error("Não foi possível extrair os dados necessários");
                    return false;
                }
                calculateReturns();
                processedImageData = {
                    cotacaoTotal: cotacaoTotal,
                    totalApostado: totalApostado,
                    gameTime: gameTime,
                };
                return true;
            } catch (error) {
                console.error("Erro durante o processamento da imagem:", error);
                try {
                    if (tesseractWorker) {
                        await tesseractWorker.terminate();
                        tesseractWorker = null;
                    }
                } catch (e) {
                    console.error("Erro ao terminar worker:", e);
                }
                throw error;
            }
        }

        function extractData(text) {
            let cotacaoFound = false;
            let apostadoFound = false;
            let timeFound = false;

            cotacaoTotal = 0;
            totalApostado = 0;
            gameTime = "";

            const lines = text.split("\n");
            console.log("Linhas extraídas:", lines);

            // --- Extração de Cotação Total ---
            const cotacaoPatterns = [
                /Cotação:?\s*(\d+[.,]\d+)/i,
                /Cotação\s*[:-]?\s*(\d+[.,]\d+)/i,
                /Cotação\s*total\s*[:-]?\s*(\d+[.,]\d+)/i,
                /Total\s*[:-]?\s*(\d+[.,]\d+)/i,
                /Odd:\s*(\d+[.,]\d+)/i, // Novo padrão para "Odd"
            ];
            for (const pattern of cotacaoPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    cotacaoTotal = parseFloat(match[1].replace(",", "."));
                    cotacaoFound = true;
                    console.log(`Cotação encontrada (padrão): ${cotacaoTotal}`);
                    break; // Para após encontrar a primeira correspondência
                }
            }
            // Tentativa alternativa se não encontrou cotação
            if (!cotacaoFound) {
                const alternativeCotacaoPattern = /(\d+[.,]\d+)\s*x?/i; // Busca por número decimal, opcionalmente seguido por 'x'
                const matches = text.match(alternativeCotacaoPattern);
                if (matches && matches[1]) {
                    // Tenta validar se é uma cotação razoável (ex: > 1.0)
                    const potentialCotacao = parseFloat(matches[1].replace(",", "."));
                    if (potentialCotacao > 1.0 && potentialCotacao < 10000) { // Limites razoáveis
                        cotacaoTotal = potentialCotacao;
                        cotacaoFound = true;
                        console.log(`Cotação encontrada (alternativa): ${cotacaoTotal}`);
                    }
                }
            }

            // --- Extração de Valor Apostado ---
            const apostadoPatterns = [
                /Valor\s*apostado:?\s*R?\$\s*(\d+[.,]\d+)/i,
                /Aposta:?\s*R?\$\s*(\d+[.,]\d+)/i,
                /Investimento:?\s*R?\$\s*(\d+[.,]\d+)/i,
                /Stake:?\s*R?\$\s*(\d+[.,]\d+)/i,
            ];
            for (const pattern of apostadoPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    totalApostado = parseFloat(match[1].replace(",", "."));
                    apostadoFound = true;
                    console.log(`Valor apostado encontrado: ${totalApostado}`);
                    break;
                }
            }

            // --- Extração da Hora do Primeiro Jogo ---
            // Primeiro, encontrar o índice da linha que contém "CLIENTE:" ou similar
            let clienteLineIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/CLIENTE:?\s*|CLIENTE\s*[:-]?\s*/i)) {
                    clienteLineIndex = i;
                    break;
                }
            }
            
            // Se encontrou a linha do cliente, procurar pelo horário nas linhas seguintes
            // que contenham padrões de jogo (Futebol, Brasil, etc.)
            if (clienteLineIndex >= 0) {
                const timePatterns = [
                    /(\d{1,2}:\d{2})/,
                    /(\d{1,2}h\d{2})/i,
                ];
                
                // Procurar nas linhas após o cliente
                for (let i = clienteLineIndex + 1; i < lines.length; i++) {
                    // Verificar se a linha parece ser o início de um jogo
                    if (lines[i].match(/Futebol|Brasil|Copa|Liga|Campeonato|Internacional/i)) {
                        // Procurar o horário nesta linha e nas próximas 2-3 linhas (para garantir)
                        for (let j = i; j < i + 4 && j < lines.length; j++) {
                            for (const pattern of timePatterns) {
                                const match = lines[j].match(pattern);
                                if (match && match[1]) {
                                    let potentialTime = match[1].replace("h", ":");
                                    // Validar formato HH:MM
                                    if (/^\d{1,2}:\d{2}$/.test(potentialTime)) {
                                        const [hour, minute] = potentialTime.split(":").map(Number);
                                        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                                            gameTime = potentialTime;
                                            timeFound = true;
                                            console.log(`Hora do primeiro jogo encontrada: ${gameTime} na linha ${j}`);
                                            break;
                                        }
                                    }
                                }
                            }
                            if (timeFound) break;
                        }
                        if (timeFound) break; // Encontrou o horário do primeiro jogo, pode parar
                    }
                }
            }
            
            // Fallback: se não encontrou o horário pelo método acima, tenta o método antigo
            if (!timeFound) {
                console.log("Método principal de extração de horário falhou, tentando método alternativo...");
                const timePatterns = [
                    /(\d{1,2}:\d{2})/,
                    /(\d{1,2}h\d{2})/i,
                ];
                
                // Procurar em todas as linhas, mas ignorar a linha do cabeçalho que contém DATA
                for (let i = 0; i < lines.length; i++) {
                    // Pular linhas que contenham "DATA:" para evitar pegar o horário do cabeçalho
                    if (lines[i].match(/DATA:?\s*|DATA\s*[:-]?\s*/i)) {
                        continue;
                    }
                    
                    for (const pattern of timePatterns) {
                        const match = lines[i].match(pattern);
                        if (match && match[1]) {
                            let potentialTime = match[1].replace("h", ":");
                            // Validar formato HH:MM
                            if (/^\d{1,2}:\d{2}$/.test(potentialTime)) {
                                const [hour, minute] = potentialTime.split(":").map(Number);
                                if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                                    gameTime = potentialTime;
                                    timeFound = true;
                                    console.log(`Hora do jogo encontrada (método alternativo): ${gameTime}`);
                                    break;
                                }
                            }
                        }
                    }
                    if (timeFound) break;
                }
            }

            console.log(`Dados extraídos: Cotação=${cotacaoTotal}, Apostado=${totalApostado}, Hora=${gameTime}`);
            return cotacaoFound; // Retorna true se pelo menos a cotação foi encontrada
        }

        function calculateReturns() {
            // Esta função pode ser usada para pré-calcular retornos se necessário
            // Por enquanto, os cálculos são feitos diretamente nos templates
        }

        // --- Lógica do Código Manual ---
        if (manualCodeButton && codeModal && codeCloseButton && manualCodeInput && applyCodeButton && resultsSection) {
            manualCodeButton.addEventListener("click", () => {
                playButtonSound();
                if (!processedImageData) {
                    alert("Por favor, processe a imagem do bilhete primeiro!");
                    return;
                }
                codeModal.style.display = "flex";
                codeModal.classList.add("show");
                manualCodeInput.value = "";
                manualCodeInput.focus();
            });

            codeCloseButton.addEventListener("click", () => {
                playButtonSound();
                codeModal.style.display = "none";
                codeModal.classList.remove("show");
            });

            applyCodeButton.addEventListener("click", () => {
                playButtonSound();
                const code = manualCodeInput.value.trim();
                if (code.length === 6 && /^[0-9]+$/.test(code)) {
                    generateTicket(code);
                    codeModal.style.display = "none";
                    codeModal.classList.remove("show");
                } else {
                    alert("Por favor, insira um código válido de 6 dígitos numéricos.");
                    manualCodeInput.focus();
                }
            });
        }

        // --- Lógica de Geração e Exibição do Bilhete ---
        function generateTicket(code) {
            if (!processedImageData) {
                alert("Erro: Dados da imagem não processados.");
                return;
            }

            const { cotacaoTotal, gameTime } = processedImageData;

            // Selecionar o template correto
            const templateFunction = bilhetesTemplates[selectedTemplate] || bilhetesTemplates.padrao;
            const ticketText = templateFunction(code, cotacaoTotal, gameTime, isCustomTitle, selectedTitle);

            // Exibir o bilhete em texto
            const ticketContainer = document.getElementById("ticketContainer");
            if (ticketContainer) {
                ticketContainer.textContent = ticketText;
                resultsSection.style.display = "block";
                resultsSection.scrollIntoView({ behavior: "smooth" });
            }

            // Gerar imagem com sobreposição foi REMOVIDO

            // Salvar bilhete gerado
            saveTicket(ticketText, code, selectedTemplate);
        }

        // --- Lógica de Upload da Imagem de Fundo --- REMOVIDA

        // --- Função handleBgImageUpload --- REMOVIDA

        // --- Lógica de Geração da Imagem com Sobreposição --- REMOVIDA

        // --- Lógica de Copiar e Limpar ---
        if (copyButton && resultsSection) {
            copyButton.addEventListener("click", () => {
                playButtonSound();
                const ticketText = document.getElementById("ticketContainer").textContent;
                navigator.clipboard
                    .writeText(ticketText)
                    .then(() => {
                        showToast("Bilhete copiado para a área de transferência!");
                    })
                    .catch((err) => {
                        console.error("Erro ao copiar texto: ", err);
                        alert("Não foi possível copiar o texto.");
                    });
            });
        }

        if (clearButton && uploadArea && previewContainer && resultsSection && titleSelectionSection && templateSelectionSection && uploadSection) {
            clearButton.addEventListener("click", () => {
                playButtonSound();
                // Resetar variáveis globais
                cotacaoTotal = 0;
                totalApostado = 0;
                processedImageData = null;
                gameTime = "";
                selectedTitle = "";
                isCustomTitle = false;
                selectedTemplate = "padrao";
                backgroundImageDataUrl = null;

                // Resetar interface
                uploadArea.style.display = "flex";
                previewContainer.style.display = "none";
                imagePreview.src = "";
                imageUpload.value = null;
                resultsSection.style.display = "none";
                // Linhas relacionadas à imagem de fundo removidas
                
                // Voltar para o início do fluxo
                uploadSection.style.display = "none";
                templateSelectionSection.style.display = "none";
                titleSelectionSection.style.display = "block";
                titleDefaultRadio.checked = true;
                titleCustomRadio.checked = false;
                customTitleContainer.style.display = "none";
                customTitleInput.value = "";
                
                // Resetar seleção de template
                const defaultTemplateRadio = document.getElementById("templatePadrao");
                if(defaultTemplateRadio) defaultTemplateRadio.checked = true;

                showToast("Campos limpos!");
            });
        }

        // --- Lógica de Bilhetes Salvos ---
        function initSavedTickets() {
            if (viewSavedButton && ticketsModal && savedTicketsCloseButton && modalTicketsList && savedTicketsContainer) {
                viewSavedButton.addEventListener("click", () => {
                    playButtonSound();
                    displaySavedTickets();
                    ticketsModal.style.display = "flex";
                    ticketsModal.classList.add("show");
                });

                savedTicketsCloseButton.addEventListener("click", () => {
                    playButtonSound();
                    ticketsModal.style.display = "none";
                    ticketsModal.classList.remove("show");
                });
            }
        }

        function saveTicket(text, code, template) {
            const savedTickets = JSON.parse(localStorage.getItem("savedTickets") || "[]");
            const newTicket = {
                id: Date.now(),
                code: code,
                template: template,
                text: text,
                date: new Date().toLocaleString("pt-BR"),
            };
            // Manter apenas os últimos 20 bilhetes
            savedTickets.unshift(newTicket);
            if (savedTickets.length > 20) {
                savedTickets.pop();
            }
            localStorage.setItem("savedTickets", JSON.stringify(savedTickets));
        }

        function displaySavedTickets() {
            if (!modalTicketsList) return;
            const savedTickets = JSON.parse(localStorage.getItem("savedTickets") || "[]");
            modalTicketsList.innerHTML = ""; // Limpar lista

            if (savedTickets.length === 0) {
                modalTicketsList.innerHTML = "<p>Nenhum bilhete salvo ainda.</p>";
                return;
            }

            savedTickets.forEach((ticket) => {
                const item = document.createElement("div");
                item.className = "saved-ticket-item";
                item.innerHTML = `
                <div class="saved-ticket-header">
                    <span>Código: ${ticket.code} (Modelo: ${ticket.template})</span>
                    <span>${ticket.date}</span>
                </div>
                <div class="saved-ticket-content">${ticket.text}</div>
                <div class="action-buttons" style="margin-top: 10px;">
                    <button class="btn btn-small copy-saved-btn" data-text="${escape(ticket.text)}"><i class="fas fa-copy"></i> Copiar</button>
                    <button class="btn btn-small btn-danger delete-saved-btn" data-id="${ticket.id}"><i class="fas fa-trash"></i> Excluir</button>
                </div>
            `;
                modalTicketsList.appendChild(item);
            });

            // Adicionar listeners para os botões de copiar e excluir
            modalTicketsList.querySelectorAll(".copy-saved-btn").forEach((button) => {
                button.addEventListener("click", (e) => {
                    playButtonSound();
                    const textToCopy = unescape(e.currentTarget.getAttribute("data-text"));
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        showToast("Bilhete copiado!");
                    });
                });
            });

            modalTicketsList.querySelectorAll(".delete-saved-btn").forEach((button) => {
                button.addEventListener("click", (e) => {
                    playButtonSound();
                    const ticketId = parseInt(e.currentTarget.getAttribute("data-id"));
                    deleteSavedTicket(ticketId);
                    displaySavedTickets(); // Atualizar a lista
                });
            });
        }

        function deleteSavedTicket(id) {
            let savedTickets = JSON.parse(localStorage.getItem("savedTickets") || "[]");
            savedTickets = savedTickets.filter((ticket) => ticket.id !== id);
            localStorage.setItem("savedTickets", JSON.stringify(savedTickets));
            showToast("Bilhete excluído!");
        }

        // --- Lógica de Tema ---
        function initTheme() {
            if (themeToggleBtn && themeIcon) {
                const savedTheme = localStorage.getItem("theme") || "light";
                document.documentElement.setAttribute("data-theme", savedTheme);
                themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

                themeToggleBtn.addEventListener("click", () => {
                    playButtonSound();
                    const currentTheme = document.documentElement.getAttribute("data-theme");
                    const newTheme = currentTheme === "light" ? "dark" : "light";
                    document.documentElement.setAttribute("data-theme", newTheme);
                    themeIcon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
                    localStorage.setItem("theme", newTheme);
                });
            }
        }

        // --- Lógica de Animação da Bola ---
        function initFootballAnimation() {
            const football = document.querySelector(".football");
            if (football) {
                // A animação é controlada puramente por CSS
            }
        }

        // --- Lógica de Controle de Sons ---
        function initSoundControl() {
            if (soundToggle && soundStatus) {
                soundsEnabled = soundToggle.checked;
                soundStatus.textContent = soundsEnabled ? "Sons ativados" : "Sons desativados";

                soundToggle.addEventListener("change", () => {
                    soundsEnabled = soundToggle.checked;
                    soundStatus.textContent = soundsEnabled ? "Sons ativados" : "Sons desativados";
                    if (soundsEnabled) {
                        playButtonSound(); // Toca o som ao reativar
                    }
                });
            }
        }

        function playButtonSound() {
            if (soundsEnabled) {
                const sound = document.getElementById("buttonSound");
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(e => console.error("Erro ao tocar som do botão:", e));
                }
            }
        }

        function playGoalSound() {
            if (soundsEnabled) {
                const sound = document.getElementById("goalSound");
                if (sound) {
                    sound.currentTime = 0;
                    sound.play().catch(e => console.error("Erro ao tocar som de gol:", e));
                }
            }
        }

        // --- Lógica das Calculadoras ---
        function initCalculators() {
            // Calculadora de Porcentagem
            if (percentCalcBtn && percentCalcModal && percentCalcCloseBtn) {
                const percentValueInput = document.getElementById("percentValue");
                const percentOfInput = document.getElementById("percentOf");
                const calcPercentBtn = document.getElementById("calcPercentBtn");
                const percentResultDiv = document.getElementById("percentResult");

                percentCalcBtn.addEventListener("click", () => {
                    playButtonSound();
                    percentCalcModal.style.display = "flex";
                    percentCalcModal.classList.add("show");
                });
                percentCalcCloseBtn.addEventListener("click", () => {
                    playButtonSound();
                    percentCalcModal.style.display = "none";
                    percentCalcModal.classList.remove("show");
                });
                calcPercentBtn.addEventListener("click", () => {
                    playButtonSound();
                    const percent = parseFloat(percentValueInput.value);
                    const ofValue = parseFloat(percentOfInput.value);
                    if (!isNaN(percent) && !isNaN(ofValue)) {
                        const result = (percent / 100) * ofValue;
                        percentResultDiv.textContent = `Resultado: ${result.toFixed(2)}`;
                    } else {
                        percentResultDiv.textContent = "Valores inválidos";
                    }
                });
            }

            // Calculadora de Banca
            if (bancaCalcBtn && bancaCalcModal && bancaCalcCloseBtn && gerenteNameInput && bancosValueInput && bancaValueInput && bancosSignSelector && bancaSignSelector && descriptionTextInput && calcBancaBtn && bancaResultText && copyBancaResultBtn) {
                bancaCalcBtn.addEventListener("click", () => {
                    playButtonSound();
                    bancaCalcModal.style.display = "flex";
                    bancaCalcModal.classList.add("show");
                });
                bancaCalcCloseBtn.addEventListener("click", () => {
                    playButtonSound();
                    bancaCalcModal.style.display = "none";
                    bancaCalcModal.classList.remove("show");
                });

                // Lógica dos seletores de sinal (+/-)
                [bancosSignSelector, bancaSignSelector].forEach(selector => {
                    selector.querySelectorAll(".sign-btn").forEach(btn => {
                        btn.addEventListener("click", (e) => {
                            playButtonSound();
                            selector.querySelectorAll(".sign-btn").forEach(b => b.classList.remove("active"));
                            e.currentTarget.classList.add("active");
                        });
                    });
                });

                calcBancaBtn.addEventListener("click", () => {
                    playButtonSound();
                    const gerente = gerenteNameInput.value.trim() || "GERENTE";
                    let bancos = parseFloat(bancosValueInput.value) || 0;
                    let banca = parseFloat(bancaValueInput.value) || 0;
                    const bancosSign = bancosSignSelector.querySelector(".active").getAttribute("data-sign");
                    const bancaSign = bancaSignSelector.querySelector(".active").getAttribute("data-sign");
                    const description = descriptionTextInput.value.trim();

                    bancos = bancosSign === "-" ? -bancos : bancos;
                    banca = bancaSign === "-" ? -banca : banca;

                    const total = bancos + banca;
                    const status = total >= 0 ? "POSITIVO" : "NEGATIVO";
                    const emoji = total >= 0 ? "✅" : "❌";

                    // Determinar quem deve a quem (Lógica Final Simplificada)
                    let quemDeveQuem = "";
                    const absBancos = Math.abs(bancos);
                    const absBanca = Math.abs(banca);
                    
                    // Calcular a diferença entre os valores absolutos
                    const valorDevido = Math.abs(absBanca - absBancos);
                    
                    if (absBanca === absBancos) {
                        quemDeveQuem = "As contas estão zeradas.";
                    } else if (absBanca > absBancos) {
                        // Se o valor absoluto da banca for maior, o colaborador deve a diferença
                        quemDeveQuem = `${gerente} deve R$ ${valorDevido.toFixed(2)} para a banca.`;
                    } else {
                        // Se o valor absoluto dos bancos for maior, a banca deve a diferença
                        quemDeveQuem = `A banca deve R$ ${valorDevido.toFixed(2)} para ${gerente}.`;
                    }

                    // Manter a exibição dos valores originais com sinal
                    const bancosDisplay = `${bancos >= 0 ? "+" : "-"} ${absBancos.toFixed(2)}`;
                    const bancaDisplay = `${banca >= 0 ? "+" : "-"} ${absBanca.toFixed(2)}`;
                    // Saldo final para exibição (pode ser diferente do valor devido)
                    const saldoFinalDisplay = `${total >= 0 ? "+" : "-"} ${Math.abs(total).toFixed(2)}`;
                    const resultString = `
*FECHAMENTO DE BANCA*
*${gerente.toUpperCase()}* 💰

*BANCOS:* ${bancosDisplay}
*BANCA:* ${bancaDisplay}

*SALDO FINAL:* ${saldoFinalDisplay}
*STATUS:* ${status} ${emoji}

${quemDeveQuem}
${description ? `\n*OBS:* ${description}` : ""}
            `.trim();

                    bancaResultText.textContent = resultString;
                });

                copyBancaResultBtn.addEventListener("click", () => {
                    playButtonSound();
                    navigator.clipboard.writeText(bancaResultText.textContent).then(() => {
                        showToast("Resultado copiado!");
                    });
                });
            }
        }

        // --- Lógica do Contador de Cambistas ---
        function initCambistasCounter() {
            if (cambistasCounter) {
                // Simulação inicial
                cambistasCount = Math.floor(Math.random() * 10) + 5; // Entre 5 e 14
                cambistasCounter.textContent = cambistasCount;

                // Simular flutuação a cada 10-30 segundos
                cambistasInterval = setInterval(() => {
                    const change = Math.random() < 0.5 ? -1 : 1; // -1 ou +1
                    cambistasCount += change;
                    if (cambistasCount < 3) cambistasCount = 3; // Mínimo de 3
                    if (cambistasCount > 25) cambistasCount = 25; // Máximo de 25
                    cambistasCounter.textContent = cambistasCount;
                }, (Math.random() * 20 + 10) * 1000); // Entre 10s e 30s
            }
        }

        // --- Toast Notification ---
        function showToast(message) {
            const existingToast = document.querySelector(".toast");
            if (existingToast) {
                document.body.removeChild(existingToast);
            }

            const toast = document.createElement("div");
            toast.className = "toast";
            toast.textContent = message;
            document.body.appendChild(toast);

            // Animação de entrada
            setTimeout(() => {
                toast.style.opacity = "1";
                toast.style.transform = "translateX(-50%) translateY(0)";
            }, 10);

            // Animação de saída
            setTimeout(() => {
                toast.style.opacity = "0";
                toast.style.transform = "translateX(-50%) translateY(20px)";
                setTimeout(() => {
                    if (toast.parentNode === document.body) {
                         document.body.removeChild(toast);
                    }
                }, 300);
            }, 2500); // Toast some após 2.5 segundos
        }
        
        // Fechar modais ao clicar fora
        window.addEventListener("click", (event) => {
            if (event.target === ticketsModal) {
                ticketsModal.style.display = "none";
                ticketsModal.classList.remove("show");
            }
            if (event.target === codeModal) {
                codeModal.style.display = "none";
                codeModal.classList.remove("show");
            }
            if (event.target === percentCalcModal) {
                percentCalcModal.style.display = "none";
                percentCalcModal.classList.remove("show");
            }
            if (event.target === bancaCalcModal) {
                bancaCalcModal.style.display = "none";
                bancaCalcModal.classList.remove("show");
            }
        });
    } // Fim da função initializePage
}); // Fim do DOMContentLoaded




// Conexão com o WebSocket do Baileys
const socket = new WebSocket("ws://localhost:3000");

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.qr) {
        const qrImg = document.getElementById("qrcode");
        if (qrImg) {
            qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(data.qr);
        }
    }
};
