import { NextRequest, NextResponse } from 'next/server';

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://212.85.17.18:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Shilinkert_KeyAdmin';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('api_access_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    console.log('🔄 Buscando instâncias da Evolution API...');
    console.log('📍 Endpoint:', `${EVOLUTION_API_URL}/instance/fetchInstances`);
    console.log('🔑 API Key:', EVOLUTION_API_KEY.substring(0, 10) + '...');

    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error('❌ Erro na resposta da Evolution API:', errorText);
      return NextResponse.json(
        { error: `Erro na Evolution API: ${evolutionResponse.status} ${evolutionResponse.statusText}` },
        { status: evolutionResponse.status }
      );
    }

    const evolutionData = await evolutionResponse.json();
    console.log('✅ Instâncias da Evolution API recebidas:', evolutionData);

    // A Evolution API retorna um array direto, não dentro de uma propriedade 'instances'
    const instances = Array.isArray(evolutionData) ? evolutionData : [];

    return NextResponse.json({
      success: true,
      instances: instances
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar instâncias da Evolution API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 