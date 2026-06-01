import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync } from 'fs';

const args = process.argv.slice(2);
const deleteUsers = args.includes('--delete-users');

// Filtra argumentos que não sejam flags para encontrar o arquivo de chave JSON
const jsonArg = args.find(arg => !arg.startsWith('--'));
const serviceAccountPath = jsonArg || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!emulatorHost && !serviceAccountPath) {
  console.error("\x1b[31m%s\x1b[0m", "Erro: Credenciais do Firebase não encontradas!");
  console.error("Para rodar o script em produção, siga um dos métodos abaixo:");
  console.error("1. Passe o caminho para a chave do Service Account JSON como argumento:");
  console.log("   node scripts/reset-db.js ./chave-firebase.json");
  console.error("2. Defina a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS:");
  console.log("   export GOOGLE_APPLICATION_CREDENTIALS=./chave-firebase.json");
  console.log("   node scripts/reset-db.js");
  console.error("\nSe estiver desenvolvendo localmente com o Emulador do Firebase, defina a porta:");
  console.log("   export FIRESTORE_EMULATOR_HOST=localhost:8080");
  console.log("   node scripts/reset-db.js");
  process.exit(1);
}

if (emulatorHost) {
  console.log(`\n🔌 Conectando ao Emulador Firestore em: ${emulatorHost}`);
  initializeApp({ projectId: 'copa2026-bolao-d6e2a' });
} else {
  if (!existsSync(serviceAccountPath)) {
    console.error("\x1b[31m%s\x1b[0m", `Erro: Arquivo de credenciais não encontrado em '${serviceAccountPath}'`);
    process.exit(1);
  }
  console.log(`\n🌐 Conectando ao Firestore de Produção usando a credencial: ${serviceAccountPath}`);
  initializeApp({
    credential: cert(serviceAccountPath)
  });
}

const db = getFirestore();

async function resetDatabase() {
  console.log(`Modo de reset: ${deleteUsers ? 'EXCLUIR usuários e palpites' : 'MANTER usuários cadastrados (resetar pontos e deletar palpites)'}`);
  console.log("----------------------------------------------------------------------");

  // 1. Resetar resultados das partidas (results)
  console.log("🧹 Limpando resultados oficiais das partidas ('results')...");
  const resultsRef = db.collection('results');
  const resultsSnap = await resultsRef.get();
  
  if (resultsSnap.size > 0) {
    const resultsBatch = db.batch();
    resultsSnap.forEach(doc => {
      resultsBatch.delete(doc.ref);
    });
    await resultsBatch.commit();
    console.log(`✅ Coleção 'results' limpa (${resultsSnap.size} documentos removidos).`);
  } else {
    console.log("ℹ️ Nenhum resultado oficial encontrado.");
  }

  // 2. Limpar mata-mata
  console.log("🧹 Removendo chave do Mata-Mata...");
  const mmRef = db.collection('torneio').doc('matamata');
  await mmRef.delete().catch(() => {});
  console.log("✅ Chave do Mata-Mata resetada.");

  // 3. Resetar Business Units (totalPts e memberCount para 0)
  console.log("🧹 Zerando estatísticas das Business Units...");
  const buRef = db.collection('businessUnits');
  const buSnap = await buRef.get();
  if (buSnap.size > 0) {
    const buBatch = db.batch();
    buSnap.forEach(doc => {
      buBatch.update(doc.ref, {
        totalPts: 0,
        memberCount: 0
      });
    });
    await buBatch.commit();
    console.log(`✅ Estatísticas de ${buSnap.size} Business Units zeradas.`);
  }

  // 4. Processar usuários
  console.log("👥 Processando coleção 'users'...");
  const usersRef = db.collection('users');
  const usersSnap = await usersRef.get();
  
  let totalPredictionsDeleted = 0;
  let usersProcessed = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    usersProcessed++;

    // Buscar todos os palpites da subcoleção 'predictions'
    const predictionsRef = userDoc.ref.collection('predictions');
    const predictionsSnap = await predictionsRef.get();
    
    if (predictionsSnap.size > 0) {
      const predBatch = db.batch();
      predictionsSnap.forEach(doc => {
        predBatch.delete(doc.ref);
      });
      await predBatch.commit();
      totalPredictionsDeleted += predictionsSnap.size;
    }

    if (deleteUsers) {
      // Exclui o documento do usuário
      await userDoc.ref.delete();
      console.log(`❌ Usuário excluído: ${userData.name || userId}`);
    } else {
      // Reseta estatísticas do usuário mantendo seu cadastro
      await userDoc.ref.update({
        pts: 0,
        exactCount: 0,
        outcomeCount: 0,
        wrongCount: 0
      });
      console.log(`🔄 Usuário resetado (pontos zerados): ${userData.name || userId}`);
    }
  }
  
  console.log("----------------------------------------------------------------------");
  console.log(`📊 Resumo da operação:`);
  console.log(`   - Usuários processados: ${usersProcessed}`);
  console.log(`   - Usuários deletados: ${deleteUsers ? usersProcessed : 0}`);
  console.log(`   - Palpites individuais removidos: ${totalPredictionsDeleted}`);
  
  // 5. Resetar apifetch lock (caso exista trava de sincronização pendente)
  const apiFetchRef = db.collection('system').doc('apifetch');
  await apiFetchRef.delete().catch(() => {});
  
  console.log("\n\x1b[32m%s\x1b[0m", ">>> Reset do banco de dados concluído com sucesso! O bolão está pronto para iniciar. <<<");
}

resetDatabase().catch(err => {
  console.error("\x1b[31m%s\x1b[0m", "Erro ao resetar o banco de dados:", err);
  process.exit(1);
});
