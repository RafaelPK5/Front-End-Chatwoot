import { NextRequest, NextResponse } from 'next/server';

// Configuração do N8N
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://212.85.17.18:5678';
const N8N_WEBHOOK_ID = process.env.N8N_WEBHOOK_ID || 'criainbox';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inboxName, channelType, platformType, authToken } = body;

    console.log('🔄 Chamando workflow N8N...');
    console.log('📍 Endpoint:', `${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}`);
    console.log('📝 Dados enviados:', { inboxName, channelType, platformType, authToken: authToken ? `${authToken.substring(0, 10)}...` : 'Não fornecido' });

    // Chamar o webhook do N8N
    const requestBody = {
      inboxName,
      channelType,
      platformType,
      authToken,
      timestamp: new Date().toISOString()
    };
    
    console.log('📦 Body completo enviado para N8N:', JSON.stringify(requestBody, null, 2));
    
    const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!n8nResponse.ok) {
      console.error('❌ Erro na resposta do N8N:', n8nResponse.status, n8nResponse.statusText);
      return NextResponse.json(
        { error: 'Erro ao executar workflow N8N' },
        { status: 500 }
      );
    }

               const n8nResult = await n8nResponse.json();
           console.log('✅ Workflow N8N executado com sucesso:', n8nResult);
           console.log('🔍 Verificando campos do N8N:', {
             hasBase64: !!n8nResult.n8n?.base64,
             hasMsg: !!n8nResult.msg,
             base64Length: n8nResult.n8n?.base64 ? n8nResult.n8n.base64.length : 0,
             msg: n8nResult.msg,
             keys: Object.keys(n8nResult),
             n8nKeys: n8nResult.n8n ? Object.keys(n8nResult.n8n) : []
           });
           console.log('📋 Resposta completa do N8N:', JSON.stringify(n8nResult, null, 2));
    
    // Verificar se é uma resposta de erro (instância já existe)
    if (n8nResult.msg && n8nResult.msg === 'Essa instancia ja existe!') {
      console.log('⚠️ Instância já existe:', n8nResult.msg);
      return NextResponse.json({
        success: false,
        n8n: n8nResult,
        message: 'Instância já existe'
      });
    }
    
         // Verificar se tem QR code (criação bem-sucedida)
     if (n8nResult.n8n?.base64) {
       console.log('✅ QR Code gerado com sucesso');
       return NextResponse.json({
         success: true,
         n8n: n8nResult,
         message: 'Instância criada com QR Code'
       });
     } else {
       console.log('⚠️ N8N não retornou base64, verificando outros campos...');
       console.log('📝 Campos disponíveis:', Object.keys(n8nResult));
       console.log('📝 Campos do n8n:', n8nResult.n8n ? Object.keys(n8nResult.n8n) : 'n8n não existe');
     }
    
    // Resposta padrão
    return NextResponse.json({
      success: true,
      n8n: n8nResult,
      message: 'Workflow N8N executado com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao chamar N8N:', error);
    console.error('❌ Detalhes do erro:', {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 