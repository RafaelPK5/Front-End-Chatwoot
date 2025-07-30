import { NextRequest, NextResponse } from 'next/server';

// Configuração do N8N Webhook
const N8N_WEBHOOK_URL = 'http://212.85.17.18:5678/webhook/get-qrcode';

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('api_access_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { inboxName } = body;

    if (!inboxName) {
      return NextResponse.json(
        { error: 'Nome do inbox é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔗 Conectando instância via N8N:', inboxName);
    console.log('📍 Webhook N8N:', N8N_WEBHOOK_URL);

    // Chamar o webhook do N8N para gerar QR code
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: inboxName
      })
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ Erro na resposta do N8N:', errorText);
      return NextResponse.json(
        { error: `Erro no N8N: ${n8nResponse.status} ${n8nResponse.statusText}` },
        { status: n8nResponse.status }
      );
    }

    const n8nData = await n8nResponse.json();
    console.log('✅ Resposta do N8N:', n8nData);

    // Verificar se retornou QR code
    if (n8nData.qrcode || n8nData.base64 || n8nData.qrCode) {
      const qrCode = n8nData.qrcode || n8nData.base64 || n8nData.qrCode;
      
      return NextResponse.json({
        success: true,
        qrCode: qrCode,
        message: 'QR Code gerado com sucesso via N8N'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'QR Code não encontrado na resposta do N8N'
      });
    }

  } catch (error: any) {
    console.error('❌ Erro ao conectar instância via N8N:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 