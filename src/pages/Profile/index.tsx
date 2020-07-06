import React, { useRef, useCallback } from 'react';
import ImagePicker from 'react-native-image-picker';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Form, FormHandles } from '@unform/core';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/auth';
import validateErrors from '../../utils/errorValidator';
import Button from '../../components/Button';
import Input from '../../components/Input';

import api from '../../services/api';

import {
  Container,
  BackButton,
  Title,
  UserAvatarButton,
  UserAvatar,
} from './styles';

interface ProfileFormData {
  name: string;
  email: string;
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const navigation = useNavigation();
  const formRef = useRef<FormHandles>(null);
  const emailInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const { user, updateUser } = useAuth();

  const handleSubmit = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          name: Yup.string().required('Nome ogrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          password: Yup.string().when('oldPassword', {
            is: password => password.length > 0,
            then: Yup.string()
              .min(4, 'Pelo menos 4 caracteres')
              .max(16, 'Máximo 16 caracteres'),
          }),
          confirmPassword: Yup.string().when('password', {
            is: password => password.length > 0,
            then: Yup.string().oneOf(
              [Yup.ref('password'), null],
              'Confirmação de senha incorreta',
            ),
          }),
          oldPassword: Yup.string().max(16, 'Máximo 16 caracteres'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const { name, email, password, confirmPassword, oldPassword } = data;
        const updatedUser = {
          name,
          email,
          ...(password
            ? {
                oldPassword,
                password,
                confirmPassword,
              }
            : {}),
        };

        const response = await api.put('profile', updatedUser);

        updateUser(response.data);

        navigation.goBack();
        Alert.alert('Perfil atualizado com sucesso!');
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          formRef.current?.setErrors(validateErrors(err));
        }
        Alert.alert(
          'Erro na atualização do perfil',
          'Ocorreu um erro na atualizacão, por favor verifique seus dados e tente novamente',
        );
      }
    },
    [navigation, updateUser],
  );

  const handeGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker(
      {
        title: 'Escolha seu avatar',
        chooseFromLibraryButtonTitle: 'Escolha da galeria',
        takePhotoButtonTitle: 'Abrir câmera',
        cancelButtonTitle: 'Cancelar',
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.error) {
          Alert.alert('Error ao atualizar avatar');
        }

        const data = new FormData();
        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}.jpg`,
          uri: response.uri,
        });

        api
          .patch('users/avatar', data)
          .then(apiResponse => {
            updateUser(apiResponse.data);
          })
          .catch(error => {
            console.log(error);
            Alert.alert('Error ao atualizar avatar');
          });
      },
    );
  }, [updateUser, user.id]);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flex: 1 }}
        >
          <Container>
            <BackButton onPress={handeGoBack}>
              <Icon name="chevron-left" size={24} color="#999591" />
            </BackButton>
            <UserAvatarButton onPress={handleUpdateAvatar}>
              <UserAvatar source={{ uri: user.avatarUrl }} />
            </UserAvatarButton>
            <View>
              <Title>Meu perfil</Title>
            </View>

            <Form ref={formRef} initialData={user} onSubmit={handleSubmit}>
              <Input
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                name="name"
                icon="user"
                placeholder="Nome"
                onSubmitEditing={() => {
                  emailInputRef.current?.focus();
                }}
              />
              <Input
                ref={emailInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                name="email"
                icon="mail"
                placeholder="E-mail"
                onSubmitEditing={() => {
                  oldPasswordInputRef.current?.focus();
                }}
              />
              <Input
                containerStyle={{ marginTop: 16 }}
                ref={oldPasswordInputRef}
                secureTextEntry
                name="oldPassword"
                icon="lock"
                placeholder="Senha atual"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
              />
              <Input
                ref={passwordInputRef}
                secureTextEntry
                name="password"
                icon="lock"
                placeholder="Nova senha"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => {
                  confirmPasswordInputRef.current?.focus();
                }}
              />
              <Input
                ref={confirmPasswordInputRef}
                secureTextEntry
                name="passwordConfirmation"
                icon="lock"
                placeholder="Cofirmar nova senha"
                textContentType="newPassword"
                returnKeyType="send"
                onSubmitEditing={() => {
                  formRef.current?.submitForm();
                }}
              />
              <Button onPress={() => formRef.current?.submitForm()}>
                Aualizar
              </Button>
            </Form>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Profile;
