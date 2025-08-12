import { NextRequest, NextResponse } from 'next/server';

const CHATWOOT_API_URL = 'http://212.85.17.18:8081';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const url = `${CHATWOOT_API_URL}/${pathString}`;
  
  // Construir URL completa com query parameters
  const urlWithParams = new URL(url);
  request.nextUrl.searchParams.forEach((value, key) => {
    urlWithParams.searchParams.append(key, value);
  });
  
  console.log('🔄 [API Route GET] Recebida requisição para:', pathString);
  console.log('🔄 [API Route GET] URL base:', url);
  console.log('🔄 [API Route GET] URL completa com params:', urlWithParams.toString());
  console.log('🔄 [API Route GET] Query params:', request.nextUrl.searchParams.toString());
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  console.log('🔄 [API Route GET] Token presente:', !!authToken);
  console.log('🔄 [API Route GET] Token (primeiros 10 chars):', authToken ? `${authToken.substring(0, 10)}...` : 'null');
  
  try {
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    console.log('🔄 [API Route GET] Fazendo requisição para Chatwoot...');
    console.log('🔄 [API Route GET] Headers:', headers);
    
    const response = await fetch(urlWithParams.toString(), {
      method: 'GET',
      headers,
    });
    
    console.log('🔄 [API Route GET] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('❌ [API Route GET] Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API Route GET] Error details:', errorText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
          }
        }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route GET] Dados retornados com sucesso');
    console.log('✅ [API Route GET] Estrutura dos dados:', {
      hasPayload: !!data.payload,
      payloadLength: data.payload?.length || 0,
      hasData: !!data.data,
      dataLength: data.data?.length || 0,
      keys: Object.keys(data)
    });
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
      }
    });
  } catch (error) {
    console.error('❌ [API Route GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
        }
      }
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
  
  console.log('🔄 [API Route POST] Recebida requisição para:', pathString);
  console.log('🔄 [API Route POST] URL completa:', url);
  console.log('🔄 [API Route POST] Body:', body);
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  console.log('🔄 [API Route POST] Token presente:', !!authToken);
  
  try {
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    console.log('🔄 [API Route POST] Fazendo requisição para Chatwoot...');
    console.log('🔄 [API Route POST] Headers:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('🔄 [API Route POST] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('❌ [API Route POST] Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API Route POST] Error details:', errorText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
          }
        }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route POST] Dados retornados com sucesso');
    console.log('✅ [API Route POST] Estrutura dos dados:', {
      hasPayload: !!data.payload,
      hasData: !!data.data,
      keys: Object.keys(data)
    });
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
      }
    });
  } catch (error) {
    console.error('❌ [API Route POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
        }
      }
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
    
    if (!response.ok) {
      console.error('❌ [API Route] Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
          }
        }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
      }
    });
  } catch (error) {
    console.error('❌ [API Route] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
        }
      }
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
    
    if (!response.ok) {
      console.error('❌ [API Route] Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}` },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
          }
        }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
      }
    });
  } catch (error) {
    console.error('❌ [API Route] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
        }
      }
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
  
  console.log('🔄 [API Route DELETE] Recebida requisição para:', pathString);
  console.log('🔄 [API Route DELETE] URL completa:', url);
  
  // Extrair o token de autenticação dos headers
  const authToken = request.headers.get('api_access_token') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  console.log('🔄 [API Route DELETE] Token presente:', !!authToken);
  console.log('🔄 [API Route DELETE] Token (primeiros 10 chars):', authToken ? `${authToken.substring(0, 10)}...` : 'null');
  
  try {
    // Preparar headers para o Chatwoot
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token de autenticação se fornecido
    if (authToken) {
      headers['api_access_token'] = authToken;
    }
    
    console.log('🔄 [API Route DELETE] Headers enviados:', headers);
    console.log('🔄 [API Route DELETE] Fazendo requisição para Chatwoot...');
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    console.log('🔄 [API Route DELETE] Resposta do Chatwoot:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('❌ [API Route DELETE] Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API Route DELETE] Error details:', errorText);
      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorText },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
          }
        }
      );
    }
    
    const data = await response.json();
    console.log('✅ [API Route DELETE] Dados retornados com sucesso');
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
      }
    });
  } catch (error) {
    console.error('❌ [API Route DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, api_access_token',
        }
      }
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