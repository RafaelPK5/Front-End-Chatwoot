'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../../store/userStore';
import { 
  getContacts, 
  searchContacts,
  createContact, 
  updateContact, 
  sendMessageToContact,
  Contact 
} from '../../lib/api/chatwootAPI';

interface ContactManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactManagementModal({ isOpen, onClose }: ContactManagementModalProps) {
  const { user } = useUserStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Estados para formulários
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  
  const [messageForm, setMessageForm] = useState({
    content: '',
    message_type: 1
  });

  // Carregar contatos
  const loadContacts = useCallback(async () => {
    if (!user?.auth_token) return;
    
    try {
      setLoading(true);
      setError(null);
      const contactsData = await getContacts(user.auth_token);
      
      // Remover duplicatas usando Set para garantir unicidade
      const seenIds = new Set();
      const uniqueContacts = contactsData.filter(contact => {
        if (!contact || !contact.id || typeof contact.id !== 'number') {
          return false;
        }
        if (seenIds.has(contact.id)) {
          return false;
        }
        seenIds.add(contact.id);
        return true;
      });
      
      setContacts(uniqueContacts);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [user?.auth_token]);

  // Pesquisar contatos
  const searchContactsData = useCallback(async (query: string) => {
    console.log('🔍 [searchContactsData] Iniciando pesquisa:', query);
    
    if (!user?.auth_token) {
      console.log('❌ [searchContactsData] Token não encontrado');
      return;
    }
    
    // Se a query estiver vazia, carregar todos os contatos
    if (!query.trim()) {
      console.log('⚠️ [searchContactsData] Query vazia, carregando todos os contatos');
      await loadContacts();
      return;
    }
    
    try {
      console.log('🔄 [searchContactsData] Fazendo requisição para API...');
      setLoading(true);
      setError(null);
      const searchResults = await searchContacts(user.auth_token, query);
      
      console.log('✅ [searchContactsData] Resultados recebidos:', searchResults.length);
      
      // Remover duplicatas usando Set para garantir unicidade
      const seenIds = new Set();
      const uniqueSearchResults = searchResults.filter(contact => {
        if (!contact || !contact.id || typeof contact.id !== 'number') {
          console.log('⚠️ [searchContactsData] Contato inválido:', contact);
          return false;
        }
        if (seenIds.has(contact.id)) {
          console.log('⚠️ [searchContactsData] Contato duplicado:', contact.id);
          return false;
        }
        seenIds.add(contact.id);
        return true;
      });
      
      console.log('✅ [searchContactsData] Contatos únicos:', uniqueSearchResults.length);
      setContacts(uniqueSearchResults);
    } catch (err: any) {
      console.error('❌ [searchContactsData] Erro:', err);
      setError(err.message || 'Erro ao pesquisar contatos');
    } finally {
      setLoading(false);
    }
  }, [user?.auth_token, loadContacts]);

  // Carregar contatos quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen, loadContacts]);

  // Pesquisar quando o termo de busca mudar
  useEffect(() => {
    console.log('🔍 [useEffect] Termo de busca mudou:', searchTerm);
    console.log('🔍 [useEffect] Modal aberto:', isOpen);
    console.log('🔍 [useEffect] Token presente:', !!user?.auth_token);
    
    if (isOpen && user?.auth_token) {
      const timeoutId = setTimeout(() => {
        if (searchTerm.trim()) {
          console.log('🔍 [useEffect] Executando pesquisa para:', searchTerm);
          searchContactsData(searchTerm);
        } else {
          console.log('🔍 [useEffect] Carregando todos os contatos');
          loadContacts();
        }
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isOpen, user?.auth_token, searchContactsData, loadContacts]);

  // Limpar formulários
  const clearForms = () => {
    setContactForm({ name: '', email: '', phone_number: '' });
    setMessageForm({ content: '', message_type: 1 });
    setSelectedContact(null);
    setIsEditing(false);
    setIsCreating(false);
    setIsSendingMessage(false);
  };

  // Fechar modal
  const handleClose = () => {
    clearForms();
    setSearchTerm('');
    onClose();
  };

  // Criar novo contato
  const handleCreateContact = async () => {
    if (!user?.auth_token || !contactForm.name.trim()) return;
    
    // Validação dos dados
    let phoneNumber: string | undefined = contactForm.phone_number.trim();
    
    // Formatar telefone se necessário (remover espaços e caracteres especiais)
    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/\D/g, ''); // Remove tudo que não é dígito
      
      // Adicionar + se não tiver e se não for vazio
      if (phoneNumber && !phoneNumber.startsWith('+')) {
        phoneNumber = `+${phoneNumber}`;
      }
      
      // Se ficou vazio após a limpeza, definir como undefined
      if (!phoneNumber) {
        phoneNumber = undefined;
      }
    }
    
    const contactData = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim() || undefined,
      phone_number: phoneNumber || undefined,
      custom_attributes: {}
    };
    
    try {
      setLoading(true);
      const newContact = await createContact(user.auth_token, contactData);
      setContacts(prev => [...prev, newContact]);
      clearForms();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  };

  // Editar contato
  const handleUpdateContact = async () => {
    if (!user?.auth_token || !selectedContact || !contactForm.name.trim()) return;
    
    try {
      setLoading(true);
      const updatedContact = await updateContact(user.auth_token, selectedContact.id, contactForm);
      setContacts(prev => prev.map(c => c.id === selectedContact.id ? updatedContact : c));
      clearForms();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar contato');
    } finally {
      setLoading(false);
    }
  };



  // Enviar mensagem para contato
  const handleSendMessageToContact = async (contact: Contact) => {
    if (!user?.auth_token || !messageForm.content.trim()) {
      setError('Por favor, preencha a mensagem');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [handleSendMessageToContact] Enviando mensagem para contato:', contact.id);
      
      const result = await sendMessageToContact(user.auth_token, contact.id, {
        content: messageForm.content.trim(),
        private: false
        // Removido inboxId forçado - deixar o sistema escolher
      });
      
      console.log('✅ [handleSendMessageToContact] Mensagem enviada com sucesso:', result);
      
      // Limpar formulário de mensagem
      setMessageForm({ content: '', message_type: 1 });
      
      // Mostrar mensagem de sucesso
      alert('Mensagem enviada com sucesso!');
      
      // Fechar modal de envio de mensagem
      setIsSendingMessage(false);
      setSelectedContact(null);
      
    } catch (err: any) {
      console.error('❌ [handleSendMessageToContact] Erro:', err);
      setError(err.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  // Selecionar contato para edição
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
          setContactForm({
        name: contact.name || '',
      email: contact.email || '',
      phone_number: contact.phone_number || ''
    });
    setIsEditing(true);
    setIsCreating(false);
    setIsSendingMessage(false);
  };

  // Selecionar contato para envio de mensagem
  const handleSelectContactForMessage = (contact: Contact) => {
    setSelectedContact(contact);
    setIsSendingMessage(true);
    setIsEditing(false);
    setIsCreating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gerenciamento de Contatos
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsCreating(true);
                setIsEditing(false);
                setIsSendingMessage(false);
                setSelectedContact(null);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Novo Contato
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Lista de Contatos */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Busca */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 p-4">{error}</div>
              ) : contacts.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts
                    .filter(contact => contact && contact.id && typeof contact.id === 'number') // Filtrar contatos válidos com ID numérico
                    .map((contact, index) => (
                    <div
                      key={`contact-${contact.id}-${contact.updated_at || Date.now()}-${index}`}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{contact.name || 'Sem nome'}</h3>
                          {contact.email && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</p>
                          )}
                          {contact.phone_number && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{contact.phone_number}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSelectContactForMessage(contact)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Enviar mensagem"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Formulário */}
          <div className="w-1/2 p-6">
            {isCreating && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Novo Contato</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateContact(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 5511987654321"
                      value={contactForm.phone_number}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading || !contactForm.name.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Criando...' : 'Criar Contato'}
                    </button>
                    <button
                      type="button"
                      onClick={clearForms}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isEditing && selectedContact && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Editar Contato</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateContact(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={contactForm.phone_number}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading || !contactForm.name.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Atualizando...' : 'Atualizar Contato'}
                    </button>
                    <button
                      type="button"
                      onClick={clearForms}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isSendingMessage && selectedContact && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Enviar Mensagem para {selectedContact.name || 'Contato'}
                </h3>
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessageToContact(selectedContact); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mensagem *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={messageForm.content}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading || !messageForm.content.trim()}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Enviando...' : 'Enviar Mensagem'}
                    </button>
                    <button
                      type="button"
                      onClick={clearForms}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!isCreating && !isEditing && !isSendingMessage && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Selecione uma ação para começar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 