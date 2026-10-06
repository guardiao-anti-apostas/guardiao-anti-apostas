const GITHUB_BLOCKLIST_URL = "https://raw.githubusercontent.com/guardiao-anti-apostas/guardiao-anti-apostas/main/blocklist.json";

async function atualizarRegras() {
  try {
    const response = await fetch(GITHUB_BLOCKLIST_URL);
    const data = await response.json();
    
    if (!data.dominios || !Array.isArray(data.dominios)) return;

    // Redireciona para a página interna de conforto criada
    const redirectUrl = chrome.runtime.getURL("bloqueado.html");

    const newRules = data.dominios.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: { 
        type: "redirect", 
        redirect: { url: redirectUrl } 
      },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ["main_frame"]
      }
    }));

    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(rule => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: newRules
    });

    console.log(`[Guardião] ${newRules.length} domínios configurados com redirecionamento de conforto.`);
  } catch (error) {
    console.error("[Guardião] Erro ao sincronizar lista:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  atualizarRegras();
  chrome.alarms.create("syncBlocklist", { periodInMinutes: 60 });
});

chrome.runtime.onStartup.addListener(() => {
  atualizarRegras();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncBlocklist") {
    atualizarRegras();
  }
});
