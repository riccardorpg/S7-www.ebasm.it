<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Parte esterna (pubblica) del sito: homepage marketing, form contatti/demo, pagine legali.
 *
 * NOTA BOZZA: i submit validano CSRF e campi obbligatori e mostrano un flash di conferma.
 * TODO: verifica reCaptcha server-side, invio email (Mailer) e persistenza della richiesta.
 */
class PublicController extends AbstractController
{
    #[Route('/', name: 'homepage', methods: ['GET'])]
    public function home(): Response
    {
        return $this->render('public/home.html.twig');
    }

    #[Route('/contatti/invia', name: 'contact_submit', methods: ['POST'])]
    public function contactSubmit(Request $request): Response
    {
        if (!$this->isCsrfTokenValid('contact', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Sessione scaduta, riprova a inviare il modulo.');

            return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
        }

        $nome = trim((string) $request->request->get('nome'));
        $cognome = trim((string) $request->request->get('cognome'));
        $email = trim((string) $request->request->get('email'));
        $messaggio = trim((string) $request->request->get('messaggio'));

        if ($nome === '' || $cognome === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $messaggio === '') {
            $this->addFlash('danger', 'Controlla i campi: nome, cognome, e-mail valida e messaggio sono obbligatori.');

            return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
        }

        // TODO: verifica reCaptcha + invio email della richiesta di contatto.
        $this->addFlash('success', 'Grazie ' . $nome . '! Abbiamo ricevuto la tua richiesta e ti risponderemo al più presto.');

        return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
    }

    #[Route('/demo/richiedi', name: 'demo_request_submit', methods: ['POST'])]
    public function demoRequestSubmit(Request $request): Response
    {
        if (!$this->isCsrfTokenValid('demo', (string) $request->request->get('_csrf_token'))) {
            $this->addFlash('danger', 'Sessione scaduta, riprova a inviare il modulo.');

            return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
        }

        $accountType = (string) $request->request->get('account_type');
        $email = trim((string) $request->request->get('email'));
        $emailConfirm = trim((string) $request->request->get('email_confirm'));
        $ragioneSociale = trim((string) $request->request->get('ragione_sociale'));
        $indirizzo = trim((string) $request->request->get('indirizzo'));
        $civico = trim((string) $request->request->get('civico'));
        $citta = trim((string) $request->request->get('citta'));
        $cap = trim((string) $request->request->get('cap'));

        $errors = [];
        if (!in_array($accountType, ['aziendale', 'professionista'], true)) {
            $errors[] = 'Seleziona il tipo di account.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Inserisci un indirizzo e-mail valido.';
        } elseif ($email !== $emailConfirm) {
            $errors[] = 'Le due e-mail non coincidono.';
        }
        if ($ragioneSociale === '' || $indirizzo === '' || $civico === '' || $citta === '') {
            $errors[] = 'Compila tutti i campi anagrafici obbligatori.';
        }
        if (!preg_match('/^\d{5}$/', $cap)) {
            $errors[] = 'Il CAP deve essere di 5 cifre.';
        }

        if ($errors !== []) {
            $this->addFlash('danger', implode(' ', $errors));

            return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
        }

        // TODO: verifica reCaptcha + invio email + creazione richiesta demo (lead) da approvare in area admin.
        $this->addFlash('success', 'Richiesta demo ricevuta! Ti invieremo a breve le istruzioni di accesso all\'indirizzo ' . $email . '.');

        return $this->redirect($this->generateUrl('homepage') . '#contatti', Response::HTTP_SEE_OTHER);
    }

    #[Route('/cookie-policy', name: 'legal_cookie', methods: ['GET'])]
    public function cookie(): Response
    {
        return $this->render('public/legal.html.twig', [
            'titolo' => 'Normativa cookie',
        ]);
    }

    #[Route('/privacy-policy', name: 'legal_privacy', methods: ['GET'])]
    public function privacy(): Response
    {
        return $this->render('public/legal.html.twig', [
            'titolo' => 'Normativa privacy',
        ]);
    }

    #[Route('/termini-e-condizioni', name: 'legal_terms', methods: ['GET'])]
    public function terms(): Response
    {
        return $this->render('public/legal.html.twig', [
            'titolo' => 'Termini e condizioni di utilizzo',
        ]);
    }
}
