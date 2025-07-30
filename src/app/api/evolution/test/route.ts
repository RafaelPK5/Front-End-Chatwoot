import { NextRequest, NextResponse } from 'next/server';

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://212.85.17.18:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'Shilinkert_KeyAdmin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Testando conectividade com a Evolution API...');
    console.log('📍 URL base:', EVOLUTION_API_URL);
    console.log('🔑 API Key:', EVOLUTION_API_KEY.substring(0, 10) + '...');

    // Testar conectividade básica
    const testResponse = await fetch(`${EVOLUTION_API_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!testResponse.ok) {
      throw new Error(`Erro na conectividade: ${testResponse.status} ${testResponse.statusText}`);
    }

    const testData = await testResponse.json();
    console.log('✅ Conectividade básica OK:', testData);

    // Testar endpoint de instâncias
    const instancesResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (!instancesResponse.ok) {
      const errorText = await instancesResponse.text();
      console.error('❌ Erro no endpoint de instâncias:', errorText);
      return NextResponse.json({
        success: false,
        connectivity: true,
        instances: false,
        error: `Erro no endpoint de instâncias: ${instancesResponse.status} ${instancesResponse.statusText}`
      });
    }

    const instancesData = await instancesResponse.json();
    console.log('✅ Endpoint de instâncias OK:', instancesData);

    return NextResponse.json({
      success: true,
      connectivity: true,
      instances: true,
      testData,
      instancesData
    });

  } catch (error: any) {
    console.error('❌ Erro no teste da Evolution API:', error);
    return NextResponse.json(
      { 
        success: false,
        connectivity: false,
        instances: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
} 