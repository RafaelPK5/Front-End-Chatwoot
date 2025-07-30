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

    const body = await request.json();
    const { instanceName } = body;

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🗑️ Excluindo instância:', instanceName);
    console.log('📍 Endpoint:', `${EVOLUTION_API_URL}/instance/delete/${instanceName}`);

    // Chamar diretamente a Evolution API para excluir instância
    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!evolutionResponse.ok) {
      console.error('❌ Erro na resposta da Evolution API:', evolutionResponse.status, evolutionResponse.statusText);
      return NextResponse.json(
        { error: 'Erro ao excluir instância na Evolution API' },
        { status: 500 }
      );
    }

    const evolutionResult = await evolutionResponse.json();
    console.log('✅ Resposta da Evolution API:', evolutionResult);

    return NextResponse.json({
      success: true,
      message: `Instância "${instanceName}" excluída com sucesso`,
      data: evolutionResult
    });

  } catch (error: any) {
    console.error('❌ Erro ao excluir instância:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 