import { NextRequest, NextResponse } from 'next/server';

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://212.85.17.18:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Shilinkert_KeyAdmin';

export async function GET(request: NextRequest) {
  try {
    // Teste básico de conectividade
    const testResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!testResponse.ok) {
      return NextResponse.json(
        { error: 'Erro na conectividade básica com a Evolution API' },
        { status: testResponse.status }
      );
    }

    const testData = await testResponse.json();

    // Teste específico do endpoint de instâncias
    const instancesResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!instancesResponse.ok) {
      return NextResponse.json(
        { error: 'Erro no endpoint de instâncias da Evolution API' },
        { status: instancesResponse.status }
      );
    }

    const instancesData = await instancesResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Teste de conectividade com a Evolution API realizado com sucesso',
      data: {
        basicConnectivity: testData,
        instances: instancesData
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 