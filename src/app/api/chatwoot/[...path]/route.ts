import { NextRequest, NextResponse } from 'next/server';

const CHATWOOT_API_URL = 'http://212.85.17.18:8081';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = `${CHATWOOT_API_URL}/${pathString}`;
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  try {
    console.log('🌐 [API Route] GET request iniciada');
    console.log('📍 URL de destino:', url);
    console.log('🔑 Token de autenticação:', authToken ? `${authToken.substring(0, 10)}...` : 'Não fornecido');
    
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.log('📡 [API Route] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      console.error('❌ [API Route] API response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route] Dados retornados com sucesso:', data);
    console.log('🔍 [API Route] Estrutura dos dados:', {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: data ? Object.keys(data) : 'null/undefined',
      hasPayload: data && 'payload' in data,
      payloadType: data && data.payload ? typeof data.payload : 'undefined',
      payloadIsArray: data && data.payload ? Array.isArray(data.payload) : false
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = `${CHATWOOT_API_URL}/${pathString}`;
  const body = await request.json();
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  try {
    console.log('🌐 [API Route] POST request iniciada');
    console.log('📍 URL de destino:', url);
    console.log('📦 Body da requisição:', body);
    console.log('🔑 Token de autenticação:', authToken ? `${authToken.substring(0, 10)}...` : 'Não fornecido');
    
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    console.log('📤 [API Route] Headers sendo enviados:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('📡 [API Route] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      console.error('❌ [API Route] API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API Route] Error response body:', errorText);
      console.error('❌ [API Route] Error response headers:', Object.fromEntries(response.headers.entries()));
      console.error('❌ [API Route] Full error details:', { 
        status: response.status, 
        statusText: response.statusText, 
        body: errorText,
        url: url,
        requestBody: body
      });
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route] Dados retornados com sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = `${CHATWOOT_API_URL}/${pathString}`;
  const body = await request.json();
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  try {
    console.log('🌐 [API Route] PUT request iniciada');
    console.log('📍 URL de destino:', url);
    console.log('📦 Body da requisição:', body);
    console.log('🔑 Token de autenticação:', authToken ? `${authToken.substring(0, 10)}...` : 'Não fornecido');
    
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('📡 [API Route] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      console.error('❌ [API Route] API response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route] Dados retornados com sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = `${CHATWOOT_API_URL}/${pathString}`;
  const body = await request.json();
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  try {
    console.log('🌐 [API Route] PATCH request iniciada');
    console.log('📍 URL de destino:', url);
    console.log('📦 Body da requisição:', body);
    console.log('🔑 Token de autenticação:', authToken ? `${authToken.substring(0, 10)}...` : 'Não fornecido');
    
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('📡 [API Route] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      console.error('❌ [API Route] API response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route] Dados retornados com sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = `${CHATWOOT_API_URL}/${pathString}`;
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  try {
    console.log('🌐 [API Route] DELETE request iniciada');
    console.log('📍 URL de destino:', url);
    console.log('🔑 Token de autenticação:', authToken ? `${authToken.substring(0, 10)}...` : 'Não fornecido');
    
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    console.log('📡 [API Route] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      console.error('❌ [API Route] API response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route] Dados retornados com sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
    },
  });
} 