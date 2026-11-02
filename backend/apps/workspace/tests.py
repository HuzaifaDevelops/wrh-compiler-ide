from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Snippet

User = get_user_model()


class WorkspaceSnippetTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='coder1',
            email='coder1@example.com',
            password='Password123!'
        )
        self.user2 = User.objects.create_user(
            username='coder2',
            email='coder2@example.com',
            password='Password123!'
        )
        self.list_create_url = reverse('snippet_list_create')

        self.snippet1 = Snippet.objects.create(
            user=self.user1,
            title='Sample 1',
            code='digit a := 10;'
        )

    def test_list_snippets_unauthenticated_fails(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_snippets_authenticated_returns_only_own_snippets(self):
        # Create snippet for user 2
        Snippet.objects.create(
            user=self.user2,
            title='User 2 Code',
            code='digit b := 20;'
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Sample 1')

    def test_create_snippet_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'title': 'New Snippet',
            'code': 'digit x := 42;\nflex(x);'
        }
        response = self.client.post(self.list_create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Snippet')
        self.assertEqual(response.data['code'], payload['code'])
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_retrieve_snippet_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('snippet_detail', kwargs={'pk': self.snippet1.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Sample 1')

    def test_user_cannot_access_other_user_snippet(self):
        self.client.force_authenticate(user=self.user2)
        detail_url = reverse('snippet_detail', kwargs={'pk': self.snippet1.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_snippet_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('snippet_detail', kwargs={'pk': self.snippet1.pk})
        payload = {
            'title': 'Updated Title',
            'code': 'digit a := 99;'
        }
        response = self.client.put(detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.snippet1.refresh_from_db()
        self.assertEqual(self.snippet1.title, 'Updated Title')
        self.assertEqual(self.snippet1.code, 'digit a := 99;')

    def test_delete_snippet_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        detail_url = reverse('snippet_detail', kwargs={'pk': self.snippet1.pk})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Snippet.objects.filter(pk=self.snippet1.pk).exists())
