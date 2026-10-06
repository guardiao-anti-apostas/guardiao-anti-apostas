// URL do seu blocklist.json no GitHub (Raw)
const GITHUB_BLOCKLIST_URL = "https://raw.githubusercontent.com/guardiao-anti-apostas/guardiao-anti-apostas/main/blocklist.json";

// Função para atualizar as regras de bloqueio do navegador
async function atualizarRegras() {
  try {
    const response = await fetch(GITHUB_BLOCKLIST_URL);
    const data = await response.json();
    
    if (!data.dominios || !Array.isArray(data.dominios)) return;

    // Converte os domínios do JSON para o formato de regras do Manifest V3
    const newRules = data.dominios.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "xmlhttprequest"]
      }
    }));

    // Obtém as regras dinâmicas atuais para removê-las antes de aplicar as novas
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    // Aplica a nova lista no motor de bloqueio do navegador
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: newRules
    });

    console.log(`[Guardião] ${newRules.length} domínios bloqueados com sucesso!`);
  } catch (error) {
    console.error("[Guardião] Erro ao sincronizar lista do GitHub:", error);
  }
}

// Atualiza a lista assim que a extensão é instalada ou iniciada
chrome.runtime.onInstalled.addListener(() => {
  atualizarRegras();
  // Configura um alarme para sincronizar a cada 60 minutos automaticamente
  chrome.alarms.create("syncBlocklist", { periodInMinutes: 60 });
});

chrome.runtime.onStartup.addListener(() => {
  atualizarRegras();
});

// Escuta o alarme periódico para manter a lista sempre atualizada
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncBlocklist") {
    atualizarRegras();
  }
});
