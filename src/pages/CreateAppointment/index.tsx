import React, { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';
import { Provider } from './types';
import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  ProvidersListContainer,
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
} from './styles';

interface RouteParams {
  providerId: string;
}

const CreateAppointment: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const { user } = useAuth();
  const route = useRoute();
  const { goBack } = useNavigation();

  useEffect(() => {
    api.get('providers').then((response) => setProviders(response.data));
  }, []);

  const routeParams = route.params as RouteParams;

  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  );

  const handleSelectedProvider = useCallback((providerId) => {
    setSelectedProvider(providerId);
  }, []);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>

        <HeaderTitle>Cabeleireiros</HeaderTitle>

        {user.avatarUrl && <UserAvatar source={{ uri: user.avatarUrl }} />}
      </Header>

      <ProvidersListContainer>
        <ProvidersList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={providers}
          keyExtractor={(provider) => provider.id}
          renderItem={({ item: provider }) => (
            <ProviderContainer
              onPress={() => handleSelectedProvider(provider.id)}
              selected={provider.id === selectedProvider}
            >
              {provider.avatarUrl && (
                <ProviderAvatar source={{ uri: provider.avatarUrl }} />
              )}
              <ProviderName>{provider.name}</ProviderName>
            </ProviderContainer>
          )}
        />
      </ProvidersListContainer>
    </Container>
  );
};

export default CreateAppointment;
