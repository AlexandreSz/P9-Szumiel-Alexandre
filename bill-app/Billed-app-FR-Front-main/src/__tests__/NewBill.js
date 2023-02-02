/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import BillsUI from '../views/BillsUI.js'

import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store.js'

import router from '../app/Router.js'

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    // Test : Modif ... par "icône de courrier dans la barre verticale doit être mise en surbrillance"
    test('Then mail icon in vertical layout should be highlighted', async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //--to-do write assertion
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      //--to-do write expect expression
      const iconActivated = windowIcon.classList.contains('active-icon')
      expect(iconActivated).toBeTruthy()
    })
  })
  describe('When I select an image in a correct format', () => {
    // TEST : Ensuite, le fichier doit afficher le nom du fichier
    test('Then the input file should display the file name', () => {
      //on ajoute le HTML
      const html = NewBillUI()
      document.body.innerHTML = html
      //la variable et la fonction sur lesquelles on veut faire le test
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const input = screen.getByTestId('file')
      input.addEventListener('change', handleChangeFile)
      //fichier au bon format: ici test sur png
      fireEvent.change(input, {
        target: {
          files: [new File(['image.png'], 'image.png', { type: 'image/png' })],
        },
      })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(input.files[0].name).toBe('image.png')
    })
    // Ensuite, la NDF est créée
    test('Then a bill is created', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      })
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      const submit = screen.getByTestId('form-new-bill')
      submit.addEventListener('submit', handleSubmit)
      fireEvent.submit(submit)
      expect(handleSubmit).toHaveBeenCalled()
    })

    // Ensuite, la NDF est supprimée si mauvais format
    test('Then the bill is deleted', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const input = screen.getByTestId('file')
      input.addEventListener('change', handleChangeFile)
      //fichier au mauvais format
      fireEvent.change(input, {
        target: {
          files: [new File(['image.txt'], 'image.txt', { type: 'image/txt' })],
        },
      })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(handleChangeFile).toHaveBeenCalledTimes(1)
      expect(input.files[0].name).toBe('image.txt')
    })
  })
})
// Lorsqu'une erreur se produit sur l'API
describe('When an error occurs on API', () => {
  beforeEach(() => {
    jest.spyOn(mockStore, 'bills')
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    localStorage.setItem(
      'user',
      JSON.stringify({ type: 'Employee', email: 'a@a' }),
    )
    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.appendChild(root)
    router()
  })

  // TEST : récupère les factures d'une API et échoue avec une erreur 404
  test('fetches bills from an API and fails with 404 message error', async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error('Erreur 404'))
        },
      }
    })
    const html = BillsUI({ error: 'Erreur 404' })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    //vérification de la présence du message err 404
    expect(message).toBeTruthy()
  })

  // TEST : récupère les factures d'une API et échoue avec une erreur 500
  test('fetches messages from an API and fails with 500 message error', async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error('Erreur 500'))
        },
      }
    })

    const html = BillsUI({ error: 'Erreur 500' })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})
// test d'intégration POST new bill

describe('Given I am connected as an employee', () => {
  describe('When i submit the form completed', () => {
    test('Then bill is create', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      // ici j'appel les données mocker via le store
      const newBills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      newBills.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => newBills.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBills.updateBill).toHaveBeenCalled()
    })
  })
})
