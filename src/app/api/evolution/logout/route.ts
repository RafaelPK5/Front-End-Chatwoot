import { NextRequest, NextResponse } from 'next/server';

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://212.85.17.18:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Shilinkert_KeyAdmin';

export async function DELETE(request: NextRequest) {
  try {
    const authToken = request.headers.get('api_access_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    // Extrair o nome da instância da URL
    const url = new URL(request.url);
    const instanceName = url.searchParams.get('instance');
    
    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância não fornecido' },
        { status: 400 }
      );
    }

    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      return NextResponse.json(
        { error: `Erro na Evolution API: ${evolutionResponse.status} ${evolutionResponse.statusText}` },
        { status: evolutionResponse.status }
      );
    }

    const evolutionData = await evolutionResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso',
      data: evolutionData
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 